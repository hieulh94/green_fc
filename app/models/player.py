from pydantic import BaseModel, Field
from typing import Optional, List


class Player(BaseModel):
    id: Optional[str] = None  # Firestore document ID
    name: str
    position: List[str]  # Array of positions
    jersey_number: Optional[int] = None
    profile_image: Optional[str] = None  # URL to profile image
    role: str = "Cầu thủ"  # Đội trưởng, Đội phó, Cầu thủ
    total_goals: int = 0  # Tổng số bàn thắng
    team_id: Optional[str] = None  # Reference to team document ID
    
    class Config:
        from_attributes = True
