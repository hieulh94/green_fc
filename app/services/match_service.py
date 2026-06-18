from typing import List, Optional
from google.cloud.firestore import Client
from app.models.match import Match
from app.repositories.match_repository import MatchRepository
from app.repositories.match_goal_repository import MatchGoalRepository
from app.repositories.match_participant_repository import MatchParticipantRepository
from app.repositories.opponent_repository import OpponentRepository
from app.repositories.player_repository import PlayerRepository
from app.schemas.match import MatchCreate, MatchUpdate, MatchResponse
from app.schemas.match_result import MatchResultUpdate
from app.schemas.match_goal import MatchGoalCreate, MatchGoalResponse


class MatchService:
    def __init__(self, db: Client):
        self.db = db
        self.repository = MatchRepository(db)

    def _match_to_response(self, match: Match) -> MatchResponse:
        """Convert Match model to MatchResponse with participant_ids, goals, and opponent"""
        return self._matches_to_responses([match])[0]

    def _matches_to_responses(self, matches: List[Match]) -> List[MatchResponse]:
        if not matches:
            return []

        match_ids = [match.id for match in matches]
        participant_repo = MatchParticipantRepository(self.db)
        goal_repo = MatchGoalRepository(self.db)
        opponent_repo = OpponentRepository(self.db)
        player_repo = PlayerRepository(self.db)

        participants_by_match = participant_repo.get_player_ids_by_match_ids(match_ids)
        goals_by_match = goal_repo.get_by_match_ids(match_ids)

        opponent_ids = list({match.opponent_id for match in matches if match.opponent_id})
        opponents_by_id = opponent_repo.get_by_ids(opponent_ids)

        player_ids = {
            goal_doc.player_id
            for goals in goals_by_match.values()
            for goal_doc in goals
        }
        players_by_id = player_repo.get_by_ids(list(player_ids))

        from app.schemas.opponent import OpponentResponse

        responses: List[MatchResponse] = []
        for match in matches:
            goals_response = []
            for goal_doc in goals_by_match.get(match.id, []):
                player = players_by_id.get(goal_doc.player_id)
                goals_response.append(MatchGoalResponse(
                    id=goal_doc.id,
                    match_id=goal_doc.match_id,
                    player_id=goal_doc.player_id,
                    goals=goal_doc.goals,
                    player_name=player.name if player else None,
                    player_jersey_number=player.jersey_number if player else None
                ))

            match_dict = match.model_dump()
            match_dict["participant_ids"] = participants_by_match.get(match.id, [])
            match_dict["goals"] = goals_response
            opponent = opponents_by_id.get(match.opponent_id)
            if opponent:
                match_dict["opponent"] = OpponentResponse.model_validate(opponent)
            responses.append(MatchResponse.model_validate(match_dict))

        return responses

    def get_matches(self, skip: int = 0, limit: int = 100, opponent_id: Optional[str] = None) -> List[MatchResponse]:
        matches = self.repository.get_all(skip=skip, limit=limit, opponent_id=opponent_id)
        return self._matches_to_responses(matches)

    def get_match(self, match_id: str) -> MatchResponse | None:
        match = self.repository.get_by_id(match_id)
        if not match:
            return None
        return self._match_to_response(match)

    def create_match(self, match: MatchCreate) -> MatchResponse:
        db_match = self.repository.create(match)
        return self._match_to_response(db_match)

    def update_match(self, match_id: str, match_update: MatchUpdate) -> MatchResponse | None:
        db_match = self.repository.update(match_id, match_update)
        if not db_match:
            return None
        return self._match_to_response(db_match)

    def delete_match(self, match_id: str) -> bool:
        goal_repository = MatchGoalRepository(self.db)
        participant_repository = MatchParticipantRepository(self.db)
        goal_repository.delete_by_match_id(match_id)
        participant_repository.delete_by_match_id(match_id)
        return self.repository.delete(match_id)

    def get_statistics(self) -> dict:
        return self.repository.get_statistics()

    def get_opponent_statistics(self) -> List[dict]:
        return self.repository.get_opponent_statistics()

    def update_match_result(self, match_id: str, result_update: MatchResultUpdate) -> MatchResponse | None:
        """Update match result, scores, goals, and participants"""
        # Validate participants (required)
        if not result_update.participant_ids or len(result_update.participant_ids) == 0:
            raise ValueError("Danh sách tham gia trận đấu là bắt buộc. Vui lòng chọn ít nhất 1 cầu thủ.")
        
        goal_repository = MatchGoalRepository(self.db)
        participant_repository = MatchParticipantRepository(self.db)
        
        # Update match result and scores
        match_update = MatchUpdate(
            result=result_update.result,
            our_score=result_update.our_score,
            opponent_score=result_update.opponent_score
        )
        db_match = self.repository.update(match_id, match_update)
        if not db_match:
            return None
        
        # Delete existing goals for this match
        goal_repository.delete_by_match_id(match_id)
        
        # Create new goals
        if result_update.goals:
            goal_creates = [
                MatchGoalCreate(match_id=match_id, player_id=goal.player_id, goals=goal.goals)
                for goal in result_update.goals
            ]
            goal_repository.create_many(goal_creates)
        
        # Delete existing participants for this match
        participant_repository.delete_by_match_id(match_id)
        # Create new participants (always create since it's required)
        participant_repository.create_many(match_id, result_update.participant_ids)
        
        # Reload match with goals, participants, and opponent
        db_match = self.repository.get_by_id(match_id)
        if not db_match:
            return None
        return self._match_to_response(db_match)
