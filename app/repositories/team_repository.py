from google.cloud.firestore import Client
from typing import List, Optional
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate


class TeamRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "teams"

    def get_by_id(self, team_id: str) -> Optional[Team]:
        doc = self.db.collection(self.collection).document(team_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = doc.id
        return Team(**data)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Team]:
        query = self.db.collection(self.collection).offset(skip).limit(limit)
        docs = query.stream()
        teams = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            teams.append(Team(**data))
        return teams

    def get_by_name(self, name: str) -> Optional[Team]:
        docs = self.db.collection(self.collection).where("name", "==", name).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            return Team(**data)
        return None

    def create(self, team: TeamCreate) -> Team:
        data = team.model_dump(exclude={"id"})
        # Convert date objects to strings if any
        for key, value in data.items():
            if hasattr(value, 'isoformat'):
                data[key] = value.isoformat()
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Team(**doc_data)

    def update(self, team_id: str, team_update: TeamUpdate) -> Optional[Team]:
        doc_ref = self.db.collection(self.collection).document(team_id)
        if not doc_ref.get().exists:
            return None

        update_data = team_update.model_dump(exclude_unset=True, exclude={"id"})
        # Convert date objects to strings if any
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):
                update_data[key] = value.isoformat()
        
        doc_ref.update(update_data)
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return Team(**doc_data)

    def delete(self, team_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(team_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
