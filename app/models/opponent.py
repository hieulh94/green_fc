from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Opponent(Base):
    __tablename__ = "opponents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    rating = Column(Integer, nullable=False, default=0)  # 0-5 stars
    review = Column(String, nullable=True)  # Text review

    matches = relationship("Match", back_populates="opponent", cascade="all, delete-orphan")

