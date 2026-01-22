import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        cred_dict = settings.get_firebase_credentials_dict()
        cred = credentials.Certificate(cred_dict)
        
        firebase_admin.initialize_app(
            cred,
            {
                'projectId': settings.firebase_project_id or cred_dict.get('project_id')
            }
        )
    except Exception as e:
        raise ValueError(
            f"Failed to initialize Firebase Admin SDK: {str(e)}. "
            "Please check FIREBASE_CREDENTIALS and FIREBASE_PROJECT_ID environment variables."
        )

# Get Firestore client
db = firestore.client()


def get_db():
    """Dependency to get Firestore database client"""
    return db
