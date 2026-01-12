# Football Team Management API

Lightweight football team management backend built with FastAPI, SQLAlchemy 2.0, and PostgreSQL.

## Features

- FastAPI for high-performance API
- SQLAlchemy 2.0 ORM
- Pydantic v2 for validation and DTOs
- PostgreSQL database
- Alembic for database migrations
- Clean architecture: Router → Service → Repository
- Production-ready structure

## Project Structure

```
green_fc/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection and session
│   ├── models/              # SQLAlchemy models
│   │   ├── team.py
│   │   └── player.py
│   ├── schemas/             # Pydantic schemas (DTOs)
│   │   ├── team.py
│   │   └── player.py
│   ├── repositories/        # Data access layer
│   │   ├── team_repository.py
│   │   └── player_repository.py
│   ├── services/            # Business logic layer
│   │   ├── team_service.py
│   │   └── player_service.py
│   └── routers/             # API endpoints
│       ├── teams.py
│       └── players.py
├── alembic/                 # Database migrations
├── alembic.ini
├── requirements.txt
└── README.md
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Create a `.env` file (copy from `.env.example`):
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/green_fc
   ENVIRONMENT=development
   ```

3. **Set up database:**
   ```bash
   # Create database
   createdb green_fc

   # Run migrations
   alembic upgrade head
   ```

4. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Teams
- `GET /teams/` - List all teams
- `GET /teams/{team_id}` - Get team by ID
- `POST /teams/` - Create a new team
- `PUT /teams/{team_id}` - Update a team
- `DELETE /teams/{team_id}` - Delete a team

### Players
- `GET /players/` - List all players (optional `team_id` filter)
- `GET /players/{player_id}` - Get player by ID
- `POST /players/` - Create a new player
- `PUT /players/{player_id}` - Update a player
- `DELETE /players/{player_id}` - Delete a player

## Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## Architecture

The project follows a clean separation of concerns:

- **Routers**: Handle HTTP requests/responses, validation, and error handling
- **Services**: Implement business logic and validation rules
- **Repositories**: Handle database operations (CRUD)
- **Models**: SQLAlchemy database models
- **Schemas**: Pydantic models for request/response validation
