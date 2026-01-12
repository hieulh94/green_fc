#!/usr/bin/env python3
"""
Quick test script to validate code structure without running the server
"""

def test_imports():
    """Test if all modules can be imported"""
    try:
        print("Testing imports...")
        
        # Test dependencies
        import fastapi
        print("✓ fastapi imported")
        
        import sqlalchemy
        print("✓ sqlalchemy imported")
        
        import pydantic
        print("✓ pydantic imported")
        
        import alembic
        print("✓ alembic imported")
        
        # Test app structure
        from app.config import settings
        print("✓ app.config imported")
        
        from app.database import Base, get_db
        print("✓ app.database imported")
        
        from app.models import Team, Player
        print("✓ app.models imported")
        
        from app.schemas import TeamCreate, TeamResponse, PlayerCreate, PlayerResponse
        print("✓ app.schemas imported")
        
        from app.repositories import TeamRepository, PlayerRepository
        print("✓ app.repositories imported")
        
        from app.services import TeamService, PlayerService
        print("✓ app.services imported")
        
        from app.routers import teams, players
        print("✓ app.routers imported")
        
        from app.main import app
        print("✓ app.main imported")
        
        print("\n✅ All imports successful! Code structure is valid.")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("\nPlease install dependencies:")
        print("  pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


if __name__ == "__main__":
    test_imports()

