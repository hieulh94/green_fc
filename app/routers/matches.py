from fastapi import APIRouter, Depends, HTTPException, status, Query
from google.cloud.firestore import Client
from typing import List, Optional

from app.database import get_db
from app.schemas.match import MatchCreate, MatchUpdate, MatchResponse
from app.schemas.match_result import MatchResultUpdate
from app.services.match_service import MatchService

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/", response_model=List[MatchResponse])
def get_matches(
    skip: int = 0,
    limit: int = 100,
    opponent_id: Optional[str] = Query(None, description="Filter by opponent ID"),
    db: Client = Depends(get_db)
):
    service = MatchService(db)
    return service.get_matches(skip=skip, limit=limit, opponent_id=opponent_id)


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: str, db: Client = Depends(get_db)):
    service = MatchService(db)
    match = service.get_match(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )
    return match


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(match: MatchCreate, db: Client = Depends(get_db)):
    service = MatchService(db)
    return service.create_match(match)


@router.put("/{match_id}", response_model=MatchResponse)
def update_match(match_id: str, match_update: MatchUpdate, db: Client = Depends(get_db)):
    service = MatchService(db)
    match = service.update_match(match_id, match_update)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )
    return match


@router.put("/{match_id}/result", response_model=MatchResponse)
def update_match_result(match_id: str, result_update: MatchResultUpdate, db: Client = Depends(get_db)):
    """Update match result, scores, goals, and participants"""
    service = MatchService(db)
    try:
        match = service.update_match_result(match_id, result_update)
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Match with id {match_id} not found"
            )
        return match
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: str, db: Client = Depends(get_db)):
    service = MatchService(db)
    success = service.delete_match(match_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )


@router.get("/statistics/summary", response_model=dict)
def get_statistics(db: Client = Depends(get_db)):
    """Get overall match statistics (wins, loses, draws)"""
    service = MatchService(db)
    return service.get_statistics()


@router.get("/statistics/opponents", response_model=List[dict])
def get_opponent_statistics(db: Client = Depends(get_db)):
    """Get match statistics grouped by opponent"""
    service = MatchService(db)
    return service.get_opponent_statistics()
