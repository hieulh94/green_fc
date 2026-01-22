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
            try:
                with open(self.firebase_credentials_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                raise ValueError(f"Failed to read credentials file: {str(e)}")
        elif self.firebase_credentials:
            # Production: parse from environment variable
            creds_str = self.firebase_credentials.strip()
            
            # Check if empty
            if not creds_str:
                raise ValueError(
                    "FIREBASE_CREDENTIALS is empty. "
                    "Please set it to a valid JSON string."
                )
            
            try:
                # Try parsing as-is first (should be compact JSON from jq -c)
                return json.loads(creds_str)
            except json.JSONDecodeError:
                try:
                    # Try replacing escaped newlines (if someone pasted formatted JSON)
                    creds_str = creds_str.replace('\\n', '\n')
                    return json.loads(creds_str)
                except json.JSONDecodeError:
                    try:
                        # Try removing all whitespace/newlines (last resort)
                        creds_str = ''.join(creds_str.split())
                        return json.loads(creds_str)
                    except json.JSONDecodeError as e:
                        # Provide helpful error message
                        preview = creds_str[:50] if len(creds_str) > 50 else creds_str
                        raise ValueError(
                            f"Failed to parse FIREBASE_CREDENTIALS as JSON: {str(e)}. "
                            f"Preview: {preview}... "
                            "Please ensure it's a valid JSON string. "
                            "Use 'cat firebase-credentials.json | jq -c' to get the correct format."
                        )
        else:
            raise ValueError(
                "Firebase credentials not found. "
                "Set FIREBASE_CREDENTIALS or FIREBASE_CREDENTIALS_PATH environment variable. "
                "On Vercel: Settings → Environment Variables → Add FIREBASE_CREDENTIALS"
            )


settings = Settings()

