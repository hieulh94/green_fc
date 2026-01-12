from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    database_url: str = ""
    environment: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fallback to DATABASE_URL env var if not set
        if not self.database_url:
            self.database_url = os.getenv("DATABASE_URL", "")
        if not self.environment:
            self.environment = os.getenv("ENVIRONMENT", "development")


settings = Settings()

