from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    opponent_id = Column(Integer, ForeignKey("opponents.id"), nullable=False)
    result = Column(String, nullable=False)  # 'win', 'lose', 'draw'
    our_score = Column(Integer, nullable=False, default=0)
    opponent_score = Column(Integer, nullable=False, default=0)
    notes = Column(String, nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)

    opponent = relationship("Opponent", back_populates="matches")
    goals = relationship("MatchGoal", back_populates="match", cascade="all, delete-orphan")
    participants = relationship("MatchParticipant", back_populates="match", cascade="all, delete-orphan")

