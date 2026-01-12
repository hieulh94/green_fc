from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class MatchParticipant(Base):
    __tablename__ = "match_participants"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)

    match = relationship("Match", back_populates="participants")
    player = relationship("Player")

    __table_args__ = (
        UniqueConstraint('match_id', 'player_id', name='uq_match_participant'),
    )

