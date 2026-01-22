from google.cloud.firestore import Client
from typing import List, Optional
from datetime import datetime, date
from app.models.match import Match
from app.schemas.match import MatchCreate, MatchUpdate


class MatchRepository:
    def __init__(self, db: Client):
        self.db = db
        self.collection = "matches"

    def get_all(self, skip: int = 0, limit: int = 100, opponent_id: Optional[str] = None) -> List[Match]:
        query = self.db.collection(self.collection)
        if opponent_id:
            query = query.where("opponent_id", "==", opponent_id)
        # Order by date descending
        # Note: Firestore requires index for compound queries (where + order_by)
        # For now, we'll fetch all and sort in memory for simplicity
        # In production, create composite index in Firestore Console
        query = query.offset(skip).limit(limit)
        docs = list(query.stream())
        matches = []
        for doc in docs:
            data = doc.to_dict()
            # Convert date string back to date object if needed
            if "date" in data:
                if isinstance(data["date"], str):
                    data["date"] = datetime.fromisoformat(data["date"]).date()
                elif hasattr(data["date"], 'date'):  # Firestore Timestamp
                    data["date"] = data["date"].date()
            data["id"] = doc.id
            matches.append(Match(**data))
        # Sort by date descending (newest first)
        matches.sort(key=lambda x: x.date, reverse=True)
        return matches

    def get_by_id(self, match_id: str) -> Optional[Match]:
        doc = self.db.collection(self.collection).document(match_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        # Convert date string or Timestamp back to date object
        if "date" in data:
            if isinstance(data["date"], str):
                data["date"] = datetime.fromisoformat(data["date"]).date()
            elif hasattr(data["date"], 'date'):  # Firestore Timestamp
                data["date"] = data["date"].date()
        data["id"] = doc.id
        return Match(**data)

    def create(self, match: MatchCreate) -> Match:
        data = match.model_dump(exclude={"id"})
        # Convert date to string for Firestore (Firestore prefers ISO format strings for dates)
        if "date" in data:
            if isinstance(data["date"], date):
                data["date"] = data["date"].isoformat()
            elif hasattr(data["date"], 'isoformat'):
                data["date"] = data["date"].isoformat()
        doc_ref = self.db.collection(self.collection).add(data)[1]
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        # Convert date string back to date object
        if "date" in doc_data and isinstance(doc_data["date"], str):
            doc_data["date"] = datetime.fromisoformat(doc_data["date"]).date()
        doc_data["id"] = doc.id
        return Match(**doc_data)

    def update(self, match_id: str, match_update: MatchUpdate) -> Optional[Match]:
        doc_ref = self.db.collection(self.collection).document(match_id)
        if not doc_ref.get().exists:
            return None
        
        update_data = match_update.model_dump(exclude_unset=True, exclude={"id"})
        # Convert date to string for Firestore
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):
                update_data[key] = value.isoformat()
        
        doc_ref.update(update_data)
        doc = doc_ref.get()
        doc_data = doc.to_dict()
        # Convert date string back to date object
        if "date" in doc_data and isinstance(doc_data["date"], str):
            doc_data["date"] = datetime.fromisoformat(doc_data["date"]).date()
        doc_data["id"] = doc.id
        return Match(**doc_data)

    def delete(self, match_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(match_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True

    def get_statistics(self) -> dict:
        """Get match statistics: wins, loses, draws"""
        all_matches = self.db.collection(self.collection).stream()
        total = 0
        wins = 0
        loses = 0
        draws = 0
        
        for doc in all_matches:
            data = doc.to_dict()
            total += 1
            result = data.get("result", "")
            if result == "win":
                wins += 1
            elif result == "lose":
                loses += 1
            elif result == "draw":
                draws += 1
        
        return {
            "total": total,
            "wins": wins,
            "loses": loses,
            "draws": draws
        }

    def get_opponent_statistics(self) -> List[dict]:
        """Get statistics grouped by opponent"""
        from app.repositories.opponent_repository import OpponentRepository
        
        # Get all matches
        all_matches = self.db.collection(self.collection).stream()
        opponent_stats = {}
        
        for doc in all_matches:
            data = doc.to_dict()
            opponent_id = data.get("opponent_id")
            result = data.get("result", "")
            
            if opponent_id not in opponent_stats:
                opponent_stats[opponent_id] = {
                    "opponent_id": opponent_id,
                    "total": 0,
                    "wins": 0,
                    "loses": 0,
                    "draws": 0
                }
            
            opponent_stats[opponent_id]["total"] += 1
            if result == "win":
                opponent_stats[opponent_id]["wins"] += 1
            elif result == "lose":
                opponent_stats[opponent_id]["loses"] += 1
            elif result == "draw":
                opponent_stats[opponent_id]["draws"] += 1
        
        # Get opponent names
        opponent_repo = OpponentRepository(self.db)
        result_list = []
        for opponent_id, stats in opponent_stats.items():
            opponent = opponent_repo.get_by_id(opponent_id)
            stats["opponent_name"] = opponent.name if opponent else "Unknown"
            result_list.append(stats)
        
        return result_list
