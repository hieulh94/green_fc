#!/bin/bash

# Simple script to start a local HTTP server for the frontend

echo "Starting Frontend Server..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Make sure the backend is running at http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then suggest alternatives
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 3000
else
    echo "Python not found. Please install Python or use another HTTP server:"
    echo "  - Node.js: npx http-server -p 3000"
    echo "  - VS Code: Install 'Live Server' extension"
fi

