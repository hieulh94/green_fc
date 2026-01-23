#!/bin/bash

# Script to start the backend server for local development

echo "🚀 Starting GREEN FC Backend..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please run setup first:"
    echo "  ./setup_local_firebase.sh"
    exit 1
fi

# Check if Firebase credentials are configured
if ! grep -q "FIREBASE_PROJECT_ID" .env; then
    echo "❌ Firebase not configured in .env!"
    echo ""
    echo "Please run setup first:"
    echo "  ./setup_local_firebase.sh"
    exit 1
fi

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ Dependencies not installed!"
    echo ""
    echo "Please install dependencies:"
    echo "  pip install -r requirements.txt"
    exit 1
fi

echo "✅ Environment ready"
echo ""
echo "🌐 Backend will be available at: http://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


