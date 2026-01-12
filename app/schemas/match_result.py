from pydantic import BaseModel, Field
from typing import List, Optional


class MatchGoalInput(BaseModel):
    player_id: int
    goals: int = 1


class MatchResultUpdate(BaseModel):
    result: str  # 'win', 'lose', 'draw'
    our_score: int
    opponent_score: int
    goals: List[MatchGoalInput] = []  # List of players who scored
    participant_ids: List[int] = Field(default_factory=list)  # List of player IDs who participated (required, validated in service)

