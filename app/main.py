from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Import all models to ensure they are registered with SQLAlchemy
from app.models import Team, Player, Opponent, Match, MatchGoal, MatchParticipant

from app.routers import teams, players, uploads, opponents, matches

app = FastAPI(
    title="GREEN FC",
    description="Lightweight football team management backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
static_dir = Path("static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(teams.router)
app.include_router(players.router)
app.include_router(uploads.router)
app.include_router(opponents.router)
app.include_router(matches.router)


@app.get("/")
def root():
    return {"message": "Football Team Management API"}

