"""
Vercel serverless function wrapper for FastAPI app
"""
import sys
import os
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from app.main import app
    from mangum import Mangum
    
    # Wrap FastAPI app with Mangum for AWS Lambda/Vercel compatibility
    handler = Mangum(app, lifespan="off")
    logger.info("FastAPI app initialized successfully")
except Exception as e:
    # Log detailed error for debugging
    import traceback
    error_details = traceback.format_exc()
    logger.error(f"Failed to initialize app: {e}")
    logger.error(f"Traceback: {error_details}")
    raise

