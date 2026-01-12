from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate


class TeamRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, team_id: int) -> Optional[Team]:
        return self.db.query(Team).filter(Team.id == team_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Team]:
        return self.db.query(Team).offset(skip).limit(limit).all()

    def get_by_name(self, name: str) -> Optional[Team]:
        return self.db.query(Team).filter(Team.name == name).first()

    def create(self, team: TeamCreate) -> Team:
        db_team = Team(**team.model_dump())
        self.db.add(db_team)
        self.db.commit()
        self.db.refresh(db_team)
        return db_team

    def update(self, team_id: int, team_update: TeamUpdate) -> Optional[Team]:
        db_team = self.get_by_id(team_id)
        if not db_team:
            return None

        update_data = team_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_team, key, value)

        self.db.commit()
        self.db.refresh(db_team)
        return db_team

    def delete(self, team_id: int) -> bool:
        db_team = self.get_by_id(team_id)
        if not db_team:
            return False

        self.db.delete(db_team)
        self.db.commit()
        return True

