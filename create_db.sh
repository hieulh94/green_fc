#!/bin/bash

# Script to create database for green_fc project

DB_NAME="green_fc"
DB_USER=$(whoami)

echo "Creating database: $DB_NAME"
echo "Database user: $DB_USER"

# Create database
createdb $DB_NAME 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' created successfully!"
    echo ""
    echo "Database connection string:"
    echo "postgresql://$DB_USER@localhost:5432/$DB_NAME"
    echo ""
    echo "Add this to your .env file:"
    echo "DATABASE_URL=postgresql://$DB_USER@localhost:5432/$DB_NAME"
else
    echo "✗ Failed to create database (might already exist)"
    echo "You can check existing databases with: psql -l"
fi

