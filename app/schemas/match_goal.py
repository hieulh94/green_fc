from pydantic import BaseModel, ConfigDict
from typing import Optional


class MatchGoalBase(BaseModel):
    player_id: str
    goals: int = 1


class MatchGoalCreate(MatchGoalBase):
    match_id: str


class MatchGoalUpdate(BaseModel):
    goals: Optional[int] = None


class MatchGoalResponse(MatchGoalBase):
    id: str
    match_id: str
    player_name: Optional[str] = None
    player_jersey_number: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

