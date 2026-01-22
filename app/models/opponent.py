from pydantic import BaseModel, Field
from typing import Optional


class Opponent(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    name: str
    phone: Optional[str] = None
    rating: int = 0  # 0-5 stars
    review: Optional[str] = None  # Text review
    
    class Config:
        from_attributes = True
