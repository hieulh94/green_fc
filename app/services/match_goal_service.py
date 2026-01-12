from typing import List
from sqlalchemy.orm import Session
from app.repositories.match_goal_repository import MatchGoalRepository
from app.schemas.match_goal import MatchGoalCreate, MatchGoalUpdate, MatchGoalResponse


class MatchGoalService:
    def __init__(self, db: Session):
        self.repository = MatchGoalRepository(db)

    def get_by_match_id(self, match_id: int) -> List[MatchGoalResponse]:
        goals = self.repository.get_by_match_id(match_id)
        return [MatchGoalResponse.model_validate(goal) for goal in goals]

    def create_many(self, goals: List[MatchGoalCreate]) -> List[MatchGoalResponse]:
        db_goals = self.repository.create_many(goals)
        return [MatchGoalResponse.model_validate(goal) for goal in db_goals]

    def delete_by_match_id(self, match_id: int) -> bool:
        return self.repository.delete_by_match_id(match_id)

