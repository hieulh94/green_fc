"""
Vercel serverless function wrapper for FastAPI app
"""
import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set environment variables if not set (for Vercel)
if not os.getenv("DATABASE_URL"):
    # This will be set in Vercel environment variables
    pass

try:
    from app.main import app
    from mangum import Mangum
    
    # Wrap FastAPI app with Mangum for AWS Lambda/Vercel compatibility
    handler = Mangum(app, lifespan="off")
except Exception as e:
    # Log error for debugging
    import logging
    logging.error(f"Failed to initialize app: {e}")
    raise

