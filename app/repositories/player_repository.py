from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerUpdate


class PlayerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, player_id: int) -> Optional[Player]:
        return self.db.query(Player).filter(Player.id == player_id).first()

    def get_all(self, skip: int = 0, limit: int = 100, team_id: Optional[int] = None) -> List[Player]:
        query = self.db.query(Player)
        if team_id:
            query = query.filter(Player.team_id == team_id)
        return query.offset(skip).limit(limit).all()

    def create(self, player: PlayerCreate) -> Player:
        db_player = Player(**player.model_dump())
        self.db.add(db_player)
        self.db.commit()
        self.db.refresh(db_player)
        return db_player

    def update(self, player_id: int, player_update: PlayerUpdate) -> Optional[Player]:
        db_player = self.get_by_id(player_id)
        if not db_player:
            return None

        update_data = player_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_player, key, value)

        self.db.commit()
        self.db.refresh(db_player)
        return db_player

    def delete(self, player_id: int) -> bool:
        db_player = self.get_by_id(player_id)
        if not db_player:
            return False

        self.db.delete(db_player)
        self.db.commit()
        return True

