from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=List[TeamResponse])
def get_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = TeamService(db)
    return service.get_teams(skip=skip, limit=limit)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    service = TeamService(db)
    team = service.get_team(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found"
        )
    return team


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    service = TeamService(db)
    try:
        return service.create_team(team)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, team_update: TeamUpdate, db: Session = Depends(get_db)):
    service = TeamService(db)
    team = service.update_team(team_id, team_update)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found"
        )
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    service = TeamService(db)
    if not service.delete_team(team_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found"
        )

