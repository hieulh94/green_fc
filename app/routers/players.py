from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse
from app.services.player_service import PlayerService

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=List[PlayerResponse])
def get_players(
    skip: int = 0,
    limit: int = 100,
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    db: Session = Depends(get_db)
):
    service = PlayerService(db)
    return service.get_players(skip=skip, limit=limit, team_id=team_id)


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    service = PlayerService(db)
    player = service.get_player(player_id)
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found"
        )
    return player


@router.post("/", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    service = PlayerService(db)
    try:
        return service.create_player(player)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, player_update: PlayerUpdate, db: Session = Depends(get_db)):
    service = PlayerService(db)
    try:
        player = service.update_player(player_id, player_update)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with id {player_id} not found"
            )
        return player
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    service = PlayerService(db)
    if not service.delete_player(player_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found"
        )

