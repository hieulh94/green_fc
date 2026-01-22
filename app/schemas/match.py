from pydantic import BaseModel, ConfigDict
from datetime import date as date_type
from typing import Optional, List


class MatchBase(BaseModel):
    date: date_type
    opponent_id: str
    result: str  # 'win', 'lose', 'draw'
    our_score: int = 0
    opponent_score: int = 0
    notes: Optional[str] = None
    is_completed: bool = False


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    date: Optional[date_type] = None
    opponent_id: Optional[str] = None
    result: Optional[str] = None
    our_score: Optional[int] = None
    opponent_score: Optional[int] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None


class MatchResponse(MatchBase):
    id: str
    opponent: Optional["OpponentResponse"] = None
    goals: List["MatchGoalResponse"] = []
    participant_ids: List[str] = []

    model_config = ConfigDict(from_attributes=True)


# Update forward reference
from app.schemas.opponent import OpponentResponse
from app.schemas.match_goal import MatchGoalResponse
MatchResponse.model_rebuild()

