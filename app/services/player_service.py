from google.cloud.firestore import Client
from typing import List, Optional

from app.repositories.player_repository import PlayerRepository
from app.repositories.team_repository import TeamRepository
from app.repositories.match_goal_repository import MatchGoalRepository
from app.repositories.match_repository import MatchRepository
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse


class PlayerService:
    def __init__(self, db: Client):
        self.repository = PlayerRepository(db)
        self.team_repository = TeamRepository(db)
        self.goal_repository = MatchGoalRepository(db)
        self.match_repository = MatchRepository(db)
        self.db = db

    def _get_completed_match_ids(self) -> set[str]:
        matches = self.match_repository.get_all(skip=0, limit=10000)
        return {match.id for match in matches if match.is_completed}

    def _calculate_all_total_goals(self) -> dict[str, int]:
        """Sum goals per player from completed matches only."""
        completed_match_ids = self._get_completed_match_ids()
        totals: dict[str, int] = {}
        for goal_doc in self.db.collection("match_goals").stream():
            data = goal_doc.to_dict()
            match_id = data.get("match_id")
            if match_id not in completed_match_ids:
                continue
            player_id = data.get("player_id")
            if not player_id:
                continue
            totals[player_id] = totals.get(player_id, 0) + data.get("goals", 0)
        return totals

    def _calculate_total_goals(self, player_id: str) -> int:
        """Calculate total goals for a player from completed matches only."""
        completed_match_ids = self._get_completed_match_ids()
        goals = self.db.collection("match_goals").where("player_id", "==", player_id).stream()
        total = 0
        for goal_doc in goals:
            data = goal_doc.to_dict()
            if data.get("match_id") in completed_match_ids:
                total += data.get("goals", 0)
        return total

    def get_player(self, player_id: str) -> Optional[PlayerResponse]:
        player = self.repository.get_by_id(player_id)
        if not player:
            return None
        
        # Calculate total_goals from match_goals
        total_goals = self._calculate_total_goals(player_id)
        player.total_goals = total_goals
        
        return PlayerResponse.model_validate(player)

    def get_players(self, skip: int = 0, limit: int = 100, team_id: Optional[str] = None) -> List[PlayerResponse]:
        players = self.repository.get_all(skip=skip, limit=limit, team_id=team_id)
        goal_totals = self._calculate_all_total_goals()

        result = []
        for player in players:
            player.total_goals = goal_totals.get(player.id, 0)
            result.append(PlayerResponse.model_validate(player))
        
        return result

    def create_player(self, player: PlayerCreate) -> PlayerResponse:
        # Validate team exists only if team_id is provided
        if player.team_id is not None:
            team = self.team_repository.get_by_id(player.team_id)
            if not team:
                raise ValueError(f"Team with id {player.team_id} does not exist")
        
        # Set total_goals to 0 for new player (will be calculated from match_goals)
        player_data = player.model_dump()
        player_data['total_goals'] = 0
        
        created_player = self.repository.create(PlayerCreate(**player_data))
        
        # Calculate total_goals (should be 0 for new player)
        total_goals = self._calculate_total_goals(created_player.id)
        created_player.total_goals = total_goals
        
        return PlayerResponse.model_validate(created_player)

    def update_player(self, player_id: str, player_update: PlayerUpdate) -> Optional[PlayerResponse]:
        # Validate team exists if team_id is being updated
        if player_update.team_id is not None:
            team = self.team_repository.get_by_id(player_update.team_id)
            if not team:
                raise ValueError(f"Team with id {player_update.team_id} does not exist")
        
        # Don't allow manual update of total_goals - it's calculated from match_goals
        update_data = player_update.model_dump(exclude_unset=True)
        if 'total_goals' in update_data:
            del update_data['total_goals']
        
        if not update_data:
            # If only total_goals was being updated, just return current player
            return self.get_player(player_id)
        
        player = self.repository.update(player_id, PlayerUpdate(**update_data))
        if not player:
            return None
        
        # Calculate total_goals from match_goals
        total_goals = self._calculate_total_goals(player_id)
        player.total_goals = total_goals
        
        return PlayerResponse.model_validate(player)

    def delete_player(self, player_id: str) -> bool:
        return self.repository.delete(player_id)
