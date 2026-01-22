from pydantic import BaseModel, ConfigDict


class TeamBase(BaseModel):
    name: str
    country: str
    founded_year: int | None = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    founded_year: int | None = None


class TeamResponse(TeamBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

