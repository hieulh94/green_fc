from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class Match(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    date: date
    opponent_id: str  # Reference to opponent document ID
    result: str  # 'win', 'lose', 'draw'
    our_score: int = 0
    opponent_score: int = 0
    notes: Optional[str] = None
    is_completed: bool = False
    
    class Config:
        from_attributes = True
