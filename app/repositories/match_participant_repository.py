from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.models.match_participant import MatchParticipant


class MatchParticipantRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_match_id(self, match_id: int) -> List[MatchParticipant]:
        return self.db.query(MatchParticipant).options(joinedload(MatchParticipant.player)).filter(MatchParticipant.match_id == match_id).all()

    def get_player_ids_by_match_id(self, match_id: int) -> List[int]:
        participants = self.db.query(MatchParticipant).filter(MatchParticipant.match_id == match_id).all()
        return [p.player_id for p in participants]

    def create(self, match_id: int, player_id: int) -> MatchParticipant:
        db_participant = MatchParticipant(match_id=match_id, player_id=player_id)
        self.db.add(db_participant)
        self.db.commit()
        self.db.refresh(db_participant)
        return db_participant

    def create_many(self, match_id: int, player_ids: List[int]) -> List[MatchParticipant]:
        # Remove duplicates
        unique_player_ids = list(set(player_ids))
        db_participants = [MatchParticipant(match_id=match_id, player_id=player_id) for player_id in unique_player_ids]
        self.db.add_all(db_participants)
        self.db.commit()
        for db_participant in db_participants:
            self.db.refresh(db_participant)
        return db_participants

    def delete_by_match_id(self, match_id: int) -> bool:
        self.db.query(MatchParticipant).filter(MatchParticipant.match_id == match_id).delete()
        self.db.commit()
        return True

    def delete(self, participant_id: int) -> bool:
        db_participant = self.db.query(MatchParticipant).filter(MatchParticipant.id == participant_id).first()
        if not db_participant:
            return False

        self.db.delete(db_participant)
        self.db.commit()
        return True

