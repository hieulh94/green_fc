from google.cloud.firestore import Client
from typing import List, Optional
from app.models.match_participant import MatchParticipant


class MatchParticipantRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "match_participants"

    def get_by_match_id(self, match_id: str) -> List[MatchParticipant]:
        docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        participants = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            participants.append(MatchParticipant(**data))
        return participants

    def get_player_ids_by_match_id(self, match_id: str) -> List[str]:
        docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        return [doc.to_dict()["player_id"] for doc in docs]

    def create(self, match_id: str, player_id: str) -> MatchParticipant:
        # Check if already exists (unique constraint)
        existing = self.db.collection(self.collection).where("match_id", "==", match_id).where("player_id", "==", player_id).limit(1).stream()
        if list(existing):
            # Already exists, return existing
            doc = list(self.db.collection(self.collection).where("match_id", "==", match_id).where("player_id", "==", player_id).limit(1).stream())[0]
            data = doc.to_dict()
            data["id"] = doc.id
            return MatchParticipant(**data)
        
        data = {"match_id": match_id, "player_id": player_id}
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return MatchParticipant(**doc_data)

    def create_many(self, match_id: str, player_ids: List[str]) -> List[MatchParticipant]:
        # Remove duplicates
        unique_player_ids = list(set(player_ids))
        batch = self.db.batch()
        doc_refs = []
        
        # Check existing participants to avoid duplicates
        existing_docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        existing_player_ids = {doc.to_dict()["player_id"] for doc in existing_docs}
        
        for player_id in unique_player_ids:
            if player_id not in existing_player_ids:
                doc_ref = self.db.collection(self.collection).document()
                batch.set(doc_ref, {"match_id": match_id, "player_id": player_id})
                doc_refs.append(doc_ref)
        
        if doc_refs:
            batch.commit()
        
        # Fetch all participants for this match
        docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        participants = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            participants.append(MatchParticipant(**data))
        return participants

    def delete_by_match_id(self, match_id: str) -> bool:
        docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        batch = self.db.batch()
        count = 0
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
        if count > 0:
            batch.commit()
        return True

    def delete(self, participant_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(participant_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
