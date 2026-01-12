from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.match import Match
from app.repositories.match_repository import MatchRepository
from app.repositories.match_goal_repository import MatchGoalRepository
from app.repositories.match_participant_repository import MatchParticipantRepository
from app.schemas.match import MatchCreate, MatchUpdate, MatchResponse
from app.schemas.match_result import MatchResultUpdate
from app.schemas.match_goal import MatchGoalCreate


class MatchService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = MatchRepository(db)

    def _match_to_response(self, match: Match) -> MatchResponse:
        """Convert Match model to MatchResponse with participant_ids"""
        try:
            # Try to get participant_ids from relationship
            participant_ids = [p.player_id for p in match.participants] if hasattr(match, 'participants') and match.participants else []
        except Exception:
            # If participants relationship fails (e.g., table doesn't exist), use empty list
            participant_ids = []
        
        match_dict = {
            **match.__dict__,
            "participant_ids": participant_ids
        }
        # Remove SQLAlchemy internal attributes
        match_dict.pop("_sa_instance_state", None)
        return MatchResponse.model_validate(match_dict)

    def get_matches(self, skip: int = 0, limit: int = 100, opponent_id: Optional[int] = None) -> List[MatchResponse]:
        matches = self.repository.get_all(skip=skip, limit=limit, opponent_id=opponent_id)
        return [self._match_to_response(match) for match in matches]

    def get_match(self, match_id: int) -> MatchResponse | None:
        match = self.repository.get_by_id(match_id)
        if not match:
            return None
        return self._match_to_response(match)

    def create_match(self, match: MatchCreate) -> MatchResponse:
        db_match = self.repository.create(match)
        return self._match_to_response(db_match)

    def update_match(self, match_id: int, match_update: MatchUpdate) -> MatchResponse | None:
        db_match = self.repository.update(match_id, match_update)
        if not db_match:
            return None
        return self._match_to_response(db_match)

    def delete_match(self, match_id: int) -> bool:
        return self.repository.delete(match_id)

    def get_statistics(self) -> dict:
        return self.repository.get_statistics()

    def get_opponent_statistics(self) -> List[dict]:
        return self.repository.get_opponent_statistics()

    def update_match_result(self, match_id: int, result_update: MatchResultUpdate) -> MatchResponse | None:
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
        try:
            participant_repository.delete_by_match_id(match_id)
            # Create new participants (always create since it's required)
            participant_repository.create_many(match_id, result_update.participant_ids)
        except Exception as e:
            # If participants table doesn't exist, raise error asking to run migration
            raise ValueError(f"Bảng match_participants chưa được tạo. Vui lòng chạy migration: {str(e)}")
        
        # Reload match with goals, participants, and opponent
        db_match = self.repository.get_by_id(match_id)
        if not db_match:
            return None
        return self._match_to_response(db_match)
