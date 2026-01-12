from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.opponent import Opponent
from app.schemas.opponent import OpponentCreate, OpponentUpdate


class OpponentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Opponent]:
        return self.db.query(Opponent).offset(skip).limit(limit).all()

    def get_by_id(self, opponent_id: int) -> Optional[Opponent]:
        return self.db.query(Opponent).filter(Opponent.id == opponent_id).first()

    def create(self, opponent: OpponentCreate) -> Opponent:
        db_opponent = Opponent(**opponent.model_dump())
        self.db.add(db_opponent)
        self.db.commit()
        self.db.refresh(db_opponent)
        return db_opponent

    def update(self, opponent_id: int, opponent_update: OpponentUpdate) -> Optional[Opponent]:
        db_opponent = self.get_by_id(opponent_id)
        if not db_opponent:
            return None
        
        update_data = opponent_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_opponent, key, value)
        
        self.db.commit()
        self.db.refresh(db_opponent)
        return db_opponent

    def delete(self, opponent_id: int) -> bool:
        db_opponent = self.get_by_id(opponent_id)
        if not db_opponent:
            return False
        
        self.db.delete(db_opponent)
        self.db.commit()
        return True

