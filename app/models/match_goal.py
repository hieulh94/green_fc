from pydantic import BaseModel, Field
from typing import Optional


class MatchGoal(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    match_id: str  # Reference to match document ID
    player_id: str  # Reference to player document ID
    goals: int = 1
    
    class Config:
        from_attributes = True
