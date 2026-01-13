#!/bin/bash

echo "🔍 Testing Database Connection..."
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "Please set it:"
    echo "  export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
    echo ""
    echo "Or pull from Vercel:"
    echo "  vercel env pull .env.local"
    echo "  export \$(cat .env.local | grep DATABASE_URL | xargs)"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo "Connection string: ${DATABASE_URL:0:50}..."
echo ""

# Test connection
echo "Testing connection..."
python3 << 'EOF'
import os
import sys

db_url = os.getenv('DATABASE_URL', '')
if not db_url:
    print('❌ DATABASE_URL not set!')
    sys.exit(1)

print(f'Testing connection...')

try:
    # Test psycopg2
    try:
        import psycopg2
        print('✅ psycopg2 imported')
    except ImportError:
        try:
            import psycopg2_binary as psycopg2
            print('✅ psycopg2_binary imported')
        except ImportError:
            print('❌ psycopg2 not found!')
            print('Please install: pip install psycopg2-binary')
            sys.exit(1)
    
    # Test SQLAlchemy
    from sqlalchemy import create_engine
    
    # Fix connection string if needed
    if db_url.startswith("postgresql://") and "postgresql+psycopg2://" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    print(f'Connecting to database...')
    engine = create_engine(db_url, connect_args={"connect_timeout": 10})
    conn = engine.connect()
    result = conn.execute("SELECT 1")
    print('✅ Connection successful!')
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'❌ Connection failed: {e}')
    print('')
    print('Please check:')
    print('  1. DATABASE_URL is correct')
    print('  2. Database is accessible from internet')
    print('  3. Password is correct')
    print('  4. psycopg2-binary is installed')
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection OK! You can now run migrations."
    echo ""
    echo "Run migrations:"
    echo "  python3 -m alembic upgrade head"
else
    echo ""
    echo "❌ Database connection failed!"
fi

