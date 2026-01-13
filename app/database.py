from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Import psycopg2 to ensure it's available
try:
    import psycopg2
except ImportError:
    try:
        import psycopg2_binary as psycopg2
    except ImportError:
        raise ImportError(
            "psycopg2-binary is required but not installed. "
            "Please ensure it's in requirements.txt"
        )

# Validate database_url before creating engine
if not settings.database_url:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please set it in Vercel Environment Variables."
    )

# Ensure connection string has correct format for PostgreSQL
database_url = settings.database_url

# Always use postgresql+psycopg2:// to explicitly use psycopg2 driver
if database_url.startswith("postgresql://"):
    # Replace postgresql:// with postgresql+psycopg2:// to explicitly use psycopg2
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
elif not database_url.startswith("postgresql+psycopg2://"):
    # If it doesn't start with postgresql:// or postgresql+psycopg2://, add prefix
    if not database_url.startswith("postgresql"):
        database_url = f"postgresql+psycopg2://{database_url}"

engine = create_engine(
    database_url, 
    echo=settings.environment == "development",
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,     # Recycle connections after 5 minutes
    connect_args={"connect_timeout": 10}  # Add connection timeout
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

