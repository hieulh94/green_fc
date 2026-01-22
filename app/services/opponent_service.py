from typing import List
from google.cloud.firestore import Client
from app.repositories.opponent_repository import OpponentRepository
from app.schemas.opponent import OpponentCreate, OpponentUpdate, OpponentResponse


class OpponentService:
    def __init__(self, db: Client):
        self.repository = OpponentRepository(db)

    def get_opponents(self, skip: int = 0, limit: int = 100) -> List[OpponentResponse]:
        opponents = self.repository.get_all(skip=skip, limit=limit)
        return [OpponentResponse.model_validate(opponent) for opponent in opponents]

    def get_opponent(self, opponent_id: str) -> OpponentResponse | None:
        opponent = self.repository.get_by_id(opponent_id)
        if not opponent:
            return None
        return OpponentResponse.model_validate(opponent)

    def create_opponent(self, opponent: OpponentCreate) -> OpponentResponse:
        db_opponent = self.repository.create(opponent)
        return OpponentResponse.model_validate(db_opponent)

    def update_opponent(self, opponent_id: str, opponent_update: OpponentUpdate) -> OpponentResponse | None:
        db_opponent = self.repository.update(opponent_id, opponent_update)
        if not db_opponent:
            return None
        return OpponentResponse.model_validate(db_opponent)

    def delete_opponent(self, opponent_id: str) -> bool:
        return self.repository.delete(opponent_id)
