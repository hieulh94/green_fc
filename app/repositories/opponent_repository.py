from google.cloud.firestore import Client
from typing import List, Optional
from app.models.opponent import Opponent
from app.schemas.opponent import OpponentCreate, OpponentUpdate


class OpponentRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "opponents"

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Opponent]:
        query = self.db.collection(self.collection).offset(skip).limit(limit)
        docs = query.stream()
        opponents = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            opponents.append(Opponent(**data))
        return opponents

    def get_by_id(self, opponent_id: str) -> Optional[Opponent]:
        doc = self.db.collection(self.collection).document(opponent_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = doc.id
        return Opponent(**data)

    def create(self, opponent: OpponentCreate) -> Opponent:
        data = opponent.model_dump(exclude={"id"})
        # Convert date objects to strings if any
        for key, value in data.items():
            if hasattr(value, 'isoformat'):
                data[key] = value.isoformat()
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Opponent(**doc_data)

    def update(self, opponent_id: str, opponent_update: OpponentUpdate) -> Optional[Opponent]:
        doc_ref = self.db.collection(self.collection).document(opponent_id)
        if not doc_ref.get().exists:
            return None
        
        update_data = opponent_update.model_dump(exclude_unset=True, exclude={"id"})
        # Convert date objects to strings if any
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):
                update_data[key] = value.isoformat()
        
        doc_ref.update(update_data)
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Opponent(**doc_data)

    def delete(self, opponent_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(opponent_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
