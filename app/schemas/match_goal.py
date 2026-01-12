from pydantic import BaseModel, ConfigDict
from typing import Optional


class MatchGoalBase(BaseModel):
    player_id: int
    goals: int = 1


class MatchGoalCreate(MatchGoalBase):
    match_id: int


class MatchGoalUpdate(BaseModel):
    goals: Optional[int] = None


class MatchGoalResponse(MatchGoalBase):
    id: int
    match_id: int
    player_name: Optional[str] = None
    player_jersey_number: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

