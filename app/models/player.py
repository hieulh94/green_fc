from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    position = Column(PG_ARRAY(String), nullable=False)  # Array of positions
    jersey_number = Column(Integer)
    profile_image = Column(String, nullable=True)  # URL to profile image
    role = Column(String, nullable=False, default="Cầu thủ")  # Đội trưởng, Đội phó, Cầu thủ
    total_goals = Column(Integer, nullable=False, default=0)  # Tổng số bàn thắng
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="players")

