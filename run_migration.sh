#!/bin/bash

# Script to run database migrations with Supabase/Vercel

echo "🗄️  Database Migration Script"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ Found .env.local file"
    echo "Loading environment variables from .env.local..."
    export $(cat .env.local | grep DATABASE_URL | xargs)
else
    echo "⚠️  .env.local not found"
    echo ""
    echo "Please either:"
    echo "  1. Run: vercel env pull .env.local"
    echo "  2. Or set DATABASE_URL manually:"
    echo "     export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "Please set it:"
    echo "  export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run migration
echo "🚀 Running migrations..."
echo ""

python3 -m alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "You can now:"
    echo "  1. Check tables on Supabase Dashboard → Table Editor"
    echo "  2. Test your API endpoints"
    echo "  3. Start using the application"
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "Please check:"
    echo "  1. DATABASE_URL is correct"
    echo "  2. Database is accessible"
    echo "  3. Password is correct"
    exit 1
fi

