from pydantic import BaseModel, Field
from typing import Optional


class MatchParticipant(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    match_id: str  # Reference to match document ID
    player_id: str  # Reference to player document ID
    
    class Config:
        from_attributes = True
