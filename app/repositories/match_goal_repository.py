from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.models.match_goal import MatchGoal
from app.schemas.match_goal import MatchGoalCreate, MatchGoalUpdate


class MatchGoalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_match_id(self, match_id: int) -> List[MatchGoal]:
        return self.db.query(MatchGoal).options(joinedload(MatchGoal.player)).filter(MatchGoal.match_id == match_id).all()

    def get_by_id(self, goal_id: int) -> Optional[MatchGoal]:
        return self.db.query(MatchGoal).options(joinedload(MatchGoal.player)).filter(MatchGoal.id == goal_id).first()

    def create(self, goal: MatchGoalCreate) -> MatchGoal:
        db_goal = MatchGoal(**goal.model_dump())
        self.db.add(db_goal)
        self.db.commit()
        self.db.refresh(db_goal)
        return db_goal

    def create_many(self, goals: List[MatchGoalCreate]) -> List[MatchGoal]:
        db_goals = [MatchGoal(**goal.model_dump()) for goal in goals]
        self.db.add_all(db_goals)
        self.db.commit()
        for db_goal in db_goals:
            self.db.refresh(db_goal)
        return db_goals

    def delete_by_match_id(self, match_id: int) -> bool:
        self.db.query(MatchGoal).filter(MatchGoal.match_id == match_id).delete()
        self.db.commit()
        return True

    def update(self, goal_id: int, goal_update: MatchGoalUpdate) -> Optional[MatchGoal]:
        db_goal = self.get_by_id(goal_id)
        if not db_goal:
            return None

        update_data = goal_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_goal, key, value)

        self.db.commit()
        self.db.refresh(db_goal)
        return db_goal

    def delete(self, goal_id: int) -> bool:
        db_goal = self.get_by_id(goal_id)
        if not db_goal:
            return False

        self.db.delete(db_goal)
        self.db.commit()
        return True

