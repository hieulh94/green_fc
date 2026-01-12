from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Validate database_url before creating engine
if not settings.database_url:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please set it in Vercel Environment Variables."
    )

engine = create_engine(
    settings.database_url, 
    echo=settings.environment == "development",
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,     # Recycle connections after 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

