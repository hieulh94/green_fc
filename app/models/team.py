from pydantic import BaseModel, Field
from typing import Optional


class Team(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    name: str
    country: str
    founded_year: Optional[int] = None
    
    class Config:
        from_attributes = True
