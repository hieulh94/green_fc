from google.cloud.firestore import Client
from typing import List, Optional

from app.repositories.team_repository import TeamRepository
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse


class TeamService:
    def __init__(self, db: Client):
        self.repository = TeamRepository(db)

    def get_team(self, team_id: str) -> Optional[TeamResponse]:
        team = self.repository.get_by_id(team_id)
        return TeamResponse.model_validate(team) if team else None

    def get_teams(self, skip: int = 0, limit: int = 100) -> List[TeamResponse]:
        teams = self.repository.get_all(skip=skip, limit=limit)
        return [TeamResponse.model_validate(team) for team in teams]

    def create_team(self, team: TeamCreate) -> TeamResponse:
        # Check if team with same name exists
        existing = self.repository.get_by_name(team.name)
        if existing:
            raise ValueError(f"Team with name '{team.name}' already exists")
        
        created_team = self.repository.create(team)
        return TeamResponse.model_validate(created_team)

    def update_team(self, team_id: str, team_update: TeamUpdate) -> Optional[TeamResponse]:
        team = self.repository.update(team_id, team_update)
        return TeamResponse.model_validate(team) if team else None

    def delete_team(self, team_id: str) -> bool:
        return self.repository.delete(team_id)
