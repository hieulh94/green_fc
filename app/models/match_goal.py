from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class MatchGoal(Base):
    __tablename__ = "match_goals"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    goals = Column(Integer, nullable=False, default=1)

    match = relationship("Match", back_populates="goals")
    player = relationship("Player")

