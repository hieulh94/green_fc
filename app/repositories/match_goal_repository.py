from google.cloud.firestore import Client
from typing import List, Optional
from app.models.match_goal import MatchGoal
from app.schemas.match_goal import MatchGoalCreate, MatchGoalUpdate


class MatchGoalRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "match_goals"

    def get_by_match_id(self, match_id: str) -> List[MatchGoal]:
        docs = self.db.collection(self.collection).where("match_id", "==", match_id).stream()
        goals = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            goals.append(MatchGoal(**data))
        return goals

    def get_by_id(self, goal_id: str) -> Optional[MatchGoal]:
        doc = self.db.collection(self.collection).document(goal_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["id"] = doc.id
        return MatchGoal(**data)

    def create(self, goal: MatchGoalCreate) -> MatchGoal:
        data = goal.model_dump(exclude={"id"})
        # Convert date objects to strings if any
        for key, value in data.items():
            if hasattr(value, 'isoformat'):
                data[key] = value.isoformat()
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return MatchGoal(**doc_data)

    def create_many(self, goals: List[MatchGoalCreate]) -> List[MatchGoal]:
        batch = self.db.batch()
        doc_refs = []
        for goal in goals:
            data = goal.model_dump(exclude={"id"})
            # Convert date objects to strings if any
            for key, value in data.items():
                if hasattr(value, 'isoformat'):
                    data[key] = value.isoformat()
            doc_ref = self.db.collection(self.collection).document()
            batch.set(doc_ref, data)
            doc_refs.append(doc_ref)
        batch.commit()
        
        # Fetch created documents
        created_goals = []
        for doc_ref in doc_refs:
            doc = doc_ref.get()
            doc_data = doc.to_dict()
            doc_data["id"] = doc.id
            created_goals.append(MatchGoal(**doc_data))
        return created_goals

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

    def update(self, goal_id: str, goal_update: MatchGoalUpdate) -> Optional[MatchGoal]:
        doc_ref = self.db.collection(self.collection).document(goal_id)
        if not doc_ref.get().exists:
            return None

        update_data = goal_update.model_dump(exclude_unset=True, exclude={"id"})
        # Convert date objects to strings if any
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):
                update_data[key] = value.isoformat()
        
        doc_ref.update(update_data)
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        doc_data["id"] = doc.id
        return MatchGoal(**doc_data)

    def delete(self, goal_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(goal_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
