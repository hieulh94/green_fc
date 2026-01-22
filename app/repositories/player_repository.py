from google.cloud.firestore import Client
from typing import List, Optional
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerUpdate


class PlayerRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "players"

    def get_by_id(self, player_id: str) -> Optional[Player]:
        doc = self.db.collection(self.collection).document(player_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = doc.id
        return Player(**data)

    def get_all(self, skip: int = 0, limit: int = 100, team_id: Optional[str] = None) -> List[Player]:
        query = self.db.collection(self.collection)
        if team_id:
            query = query.where("team_id", "==", team_id)
        query = query.offset(skip).limit(limit)
        docs = query.stream()
        players = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            players.append(Player(**data))
        return players

    def create(self, player: PlayerCreate) -> Player:
        data = player.model_dump(exclude={"id"})
        # Convert date objects to strings if any
        for key, value in data.items():
            if hasattr(value, 'isoformat'):
                data[key] = value.isoformat()
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Player(**doc_data)

    def update(self, player_id: str, player_update: PlayerUpdate) -> Optional[Player]:
        doc_ref = self.db.collection(self.collection).document(player_id)
        if not doc_ref.get().exists:
            return None

        update_data = player_update.model_dump(exclude_unset=True, exclude={"id"})
        # Convert date objects to strings if any
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):
                update_data[key] = value.isoformat()
        
        doc_ref.update(update_data)
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Player(**doc_data)

    def delete(self, player_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(player_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
