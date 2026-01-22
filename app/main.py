from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pathlib import Path
import logging
import traceback

from app.routers import teams, players, uploads, opponents, matches

logger = logging.getLogger(__name__)

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

# Global exception handler to ensure JSON responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions and return JSON"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "message": "Internal server error"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

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

