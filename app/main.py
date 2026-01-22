from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import teams, players, uploads, opponents, matches

app = FastAPI(
    title="GREEN FC",
    description="Lightweight football team management backend",
    version="1.0.0",
    root_path="/api"  # Mount app at /api for Vercel routing
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
# In serverless environment, static files may not be available
# Only mount if directory exists and we're not in serverless mode
static_dir = Path("static")
if static_dir.exists() and static_dir.is_dir():
    try:
        app.mount("/static", StaticFiles(directory="static"), name="static")
    except Exception:
        # Ignore if static files can't be mounted (e.g., in serverless)
        pass

app.include_router(teams.router)
app.include_router(players.router)
app.include_router(uploads.router)
app.include_router(opponents.router)
app.include_router(matches.router)


@app.get("/")
def root():
    return {"message": "Football Team Management API"}


@app.get("/health")
def health_check():
    """Health check endpoint to test Firebase connection"""
    try:
        from app.database import get_db
        db = get_db()
        # Try to access Firestore (just check if initialized)
        return {
            "status": "healthy",
            "firebase": "connected",
            "message": "API is running"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "firebase": "disconnected",
            "error": str(e),
            "message": "Firebase connection failed"
        }, 500

