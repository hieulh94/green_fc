from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class PlayerBase(BaseModel):
    name: str
    position: List[str]  # List of positions
    jersey_number: int | None = None
    profile_image: str | None = None
    role: str = "Cầu thủ"  # Đội trưởng, Đội phó, Cầu thủ
    total_goals: int = 0  # Tổng số bàn thắng (sẽ được tính từ match_goals)
    team_id: int | None = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    name: str | None = None
    position: List[str] | None = None
    jersey_number: int | None = None
    profile_image: str | None = None
    role: str | None = None
    total_goals: int | None = None
    team_id: int | None = None


class PlayerResponse(PlayerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

