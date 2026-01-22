import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
db = None

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global db
    if db is not None:
        return db
    
    if not firebase_admin._apps:
        try:
            cred_dict = settings.get_firebase_credentials_dict()
            if not cred_dict:
                raise ValueError("Firebase credentials dictionary is empty")
            
            cred = credentials.Certificate(cred_dict)
            project_id = settings.firebase_project_id or cred_dict.get('project_id')
            
            if not project_id:
                raise ValueError("FIREBASE_PROJECT_ID is required")
            
            firebase_admin.initialize_app(
                cred,
                {
                    'projectId': project_id
                }
            )
            logger.info(f"Firebase initialized with project: {project_id}")
        except Exception as e:
            error_msg = (
                f"Failed to initialize Firebase Admin SDK: {str(e)}. "
                "Please check FIREBASE_CREDENTIALS and FIREBASE_PROJECT_ID environment variables."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    # Get Firestore client
    db = firestore.client()
    return db

# Initialize on import
try:
    db = initialize_firebase()
except Exception as e:
    logger.warning(f"Firebase initialization failed: {e}. Will retry on first use.")
    db = None


def get_db():
    """Dependency to get Firestore database client"""
    global db
    if db is None:
        db = initialize_firebase()
    return db
