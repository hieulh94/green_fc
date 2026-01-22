from pydantic import BaseModel, ConfigDict, Field


class OpponentBase(BaseModel):
    name: str
    phone: str | None = None
    rating: int = Field(default=0, ge=0, le=5)  # 0-5 stars
    review: str | None = None  # Text review


class OpponentCreate(OpponentBase):
    pass


class OpponentUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    rating: int | None = Field(None, ge=0, le=5)
    review: str | None = None


class OpponentResponse(OpponentBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

