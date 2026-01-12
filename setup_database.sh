#!/bin/bash

# Complete database setup script

echo "=== Setting up Database ==="
echo ""

# Create database if not exists
echo "1. Creating database..."
createdb green_fc 2>&1 | grep -v "already exists" && echo "✓ Database created" || echo "✓ Database already exists"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "2. Creating .env file..."
    echo "DATABASE_URL=postgresql://$(whoami)@localhost:5432/green_fc" > .env
    echo "ENVIRONMENT=development" >> .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=== Database Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Install dependencies: pip install -r requirements.txt"
echo "2. Create migration: alembic revision --autogenerate -m 'initial migration'"
echo "3. Apply migration: alembic upgrade head"
echo "4. Run server: uvicorn app.main:app --reload"

