#!/bin/bash

# Script to copy frontend files to public directory for Vercel

echo "📁 Copying frontend files to public directory..."

# Create public directory
mkdir -p public

# Copy all frontend files
cp frontend/index.html public/
cp frontend/styles.css public/
cp frontend/app.js public/
cp frontend/api.js public/
cp frontend/positions.js public/

echo "✅ Files copied successfully!"
echo ""
echo "Files in public/:"
ls -la public/

echo ""
echo "Next steps:"
echo "1. git add public/"
echo "2. git commit -m 'Add public directory with frontend files'"
echo "3. git push"

