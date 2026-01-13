from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.repositories.player_repository import PlayerRepository
from app.repositories.team_repository import TeamRepository
from app.models.match_goal import MatchGoal
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse


class PlayerService:
    def __init__(self, db: Session):
        self.repository = PlayerRepository(db)
        self.team_repository = TeamRepository(db)
        self.db = db

    def _calculate_total_goals(self, player_id: int) -> int:
        """Calculate total goals for a player from match_goals"""
        result = self.db.query(func.sum(MatchGoal.goals)).filter(
            MatchGoal.player_id == player_id
        ).scalar()
        return int(result) if result else 0

    def get_player(self, player_id: int) -> Optional[PlayerResponse]:
        player = self.repository.get_by_id(player_id)
        if not player:
            return None
        
        # Calculate total_goals from match_goals
        total_goals = self._calculate_total_goals(player_id)
        player.total_goals = total_goals
        
        return PlayerResponse.model_validate(player)

    def get_players(self, skip: int = 0, limit: int = 100, team_id: Optional[int] = None) -> List[PlayerResponse]:
        players = self.repository.get_all(skip=skip, limit=limit, team_id=team_id)
        
        # Calculate total_goals for each player
        result = []
        for player in players:
            total_goals = self._calculate_total_goals(player.id)
            player.total_goals = total_goals
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

    def update_player(self, player_id: int, player_update: PlayerUpdate) -> Optional[PlayerResponse]:
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

    def delete_player(self, player_id: int) -> bool:
        return self.repository.delete(player_id)

