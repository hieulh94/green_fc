#!/bin/bash

# Quick start script for Football Team Management API

echo "Starting Football Team Management API..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/green_fc
ENVIRONMENT=development
EOF
    echo "⚠️  Please update .env with your database credentials"
fi

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

