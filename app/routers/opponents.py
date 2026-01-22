from fastapi import APIRouter, Depends, HTTPException, status, Query
from google.cloud.firestore import Client
from typing import List, Optional

from app.database import get_db
from app.schemas.opponent import OpponentCreate, OpponentUpdate, OpponentResponse
from app.services.opponent_service import OpponentService

router = APIRouter(prefix="/opponents", tags=["opponents"])


@router.get("/", response_model=List[OpponentResponse])
def get_opponents(skip: int = 0, limit: int = 100, db: Client = Depends(get_db)):
    service = OpponentService(db)
    return service.get_opponents(skip=skip, limit=limit)


@router.get("/{opponent_id}", response_model=OpponentResponse)
def get_opponent(opponent_id: str, db: Client = Depends(get_db)):
    service = OpponentService(db)
    opponent = service.get_opponent(opponent_id)
    if not opponent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opponent with id {opponent_id} not found"
        )
    return opponent


@router.post("/", response_model=OpponentResponse, status_code=status.HTTP_201_CREATED)
def create_opponent(opponent: OpponentCreate, db: Client = Depends(get_db)):
    service = OpponentService(db)
    return service.create_opponent(opponent)


@router.put("/{opponent_id}", response_model=OpponentResponse)
def update_opponent(opponent_id: str, opponent_update: OpponentUpdate, db: Client = Depends(get_db)):
    service = OpponentService(db)
    opponent = service.update_opponent(opponent_id, opponent_update)
    if not opponent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opponent with id {opponent_id} not found"
        )
    return opponent


@router.delete("/{opponent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opponent(opponent_id: str, db: Client = Depends(get_db)):
    service = OpponentService(db)
    success = service.delete_opponent(opponent_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opponent with id {opponent_id} not found"
        )
