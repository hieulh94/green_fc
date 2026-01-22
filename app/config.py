from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import json


class Settings(BaseSettings):
    firebase_project_id: str = ""
    firebase_credentials: str = ""  # JSON string of credentials
    firebase_credentials_path: str = ""  # Path to credentials file (for local dev)
    environment: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fallback to env vars if not set
        if not self.firebase_project_id:
            self.firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "")
        if not self.firebase_credentials:
            self.firebase_credentials = os.getenv("FIREBASE_CREDENTIALS", "")
        if not self.firebase_credentials_path:
            self.firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
        if not self.environment:
            self.environment = os.getenv("ENVIRONMENT", "development")
    
    def get_firebase_credentials_dict(self) -> dict:
        """Get Firebase credentials as a dictionary"""
        if self.firebase_credentials_path and os.path.exists(self.firebase_credentials_path):
            # Local development: read from file
            with open(self.firebase_credentials_path, 'r') as f:
                return json.load(f)
        elif self.firebase_credentials:
            # Production: parse from environment variable
            try:
                return json.loads(self.firebase_credentials)
            except json.JSONDecodeError:
                # Try parsing as escaped string
                return json.loads(self.firebase_credentials.replace('\\n', '\n'))
        else:
            raise ValueError(
                "Firebase credentials not found. "
                "Set FIREBASE_CREDENTIALS or FIREBASE_CREDENTIALS_PATH environment variable."
            )


settings = Settings()

