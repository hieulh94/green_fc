from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List, Optional
from app.models.match import Match
from app.models.match_goal import MatchGoal
from app.models.match_participant import MatchParticipant
from app.schemas.match import MatchCreate, MatchUpdate


class MatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100, opponent_id: Optional[int] = None) -> List[Match]:
        try:
            query = self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player),
                selectinload(Match.participants).selectinload(MatchParticipant.player)
            )
        except Exception:
            # If participants table doesn't exist yet, load without it
            query = self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player)
            )
        if opponent_id:
            query = query.filter(Match.opponent_id == opponent_id)
        return query.order_by(Match.date.desc()).offset(skip).limit(limit).all()

    def get_by_id(self, match_id: int) -> Optional[Match]:
        try:
            return self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player),
                selectinload(Match.participants).selectinload(MatchParticipant.player)
            ).filter(Match.id == match_id).first()
        except Exception:
            # If participants table doesn't exist yet, load without it
            return self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player)
            ).filter(Match.id == match_id).first()

    def create(self, match: MatchCreate) -> Match:
        db_match = Match(**match.model_dump())
        self.db.add(db_match)
        self.db.commit()
        self.db.refresh(db_match)
        return db_match

    def update(self, match_id: int, match_update: MatchUpdate) -> Optional[Match]:
        db_match = self.db.query(Match).filter(Match.id == match_id).first()
        if not db_match:
            return None
        
        update_data = match_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_match, key, value)
        
        self.db.commit()
        self.db.refresh(db_match)
        # Reload with opponent, goals, and participants relationships
        try:
            return self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player),
                selectinload(Match.participants).selectinload(MatchParticipant.player)
            ).filter(Match.id == match_id).first()
        except Exception:
            # If participants table doesn't exist yet, load without it
            return self.db.query(Match).options(
                joinedload(Match.opponent),
                selectinload(Match.goals).selectinload(MatchGoal.player)
            ).filter(Match.id == match_id).first()

    def delete(self, match_id: int) -> bool:
        db_match = self.get_by_id(match_id)
        if not db_match:
            return False
        
        self.db.delete(db_match)
        self.db.commit()
        return True

    def get_statistics(self) -> dict:
        """Get match statistics: wins, loses, draws"""
        total = self.db.query(func.count(Match.id)).scalar() or 0
        wins = self.db.query(func.count(Match.id)).filter(Match.result == 'win').scalar() or 0
        loses = self.db.query(func.count(Match.id)).filter(Match.result == 'lose').scalar() or 0
        draws = self.db.query(func.count(Match.id)).filter(Match.result == 'draw').scalar() or 0
        
        return {
            "total": total,
            "wins": wins,
            "loses": loses,
            "draws": draws
        }

    def get_opponent_statistics(self) -> List[dict]:
        """Get statistics grouped by opponent"""
        from app.models.opponent import Opponent
        
        stats = (
            self.db.query(
                Opponent.id,
                Opponent.name,
                func.count(Match.id).label('total'),
                func.sum(func.case((Match.result == 'win', 1), else_=0)).label('wins'),
                func.sum(func.case((Match.result == 'lose', 1), else_=0)).label('loses'),
                func.sum(func.case((Match.result == 'draw', 1), else_=0)).label('draws')
            )
            .join(Match, Opponent.id == Match.opponent_id)
            .group_by(Opponent.id, Opponent.name)
            .all()
        )
        
        return [
            {
                "opponent_id": stat.id,
                "opponent_name": stat.name,
                "total": stat.total or 0,
                "wins": stat.wins or 0,
                "loses": stat.loses or 0,
                "draws": stat.draws or 0
            }
            for stat in stats
        ]

