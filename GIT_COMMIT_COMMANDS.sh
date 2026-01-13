#!/bin/bash

# Script to commit and push changes for Vercel deployment
# Changes: Make team_id optional when creating players

echo "🚀 Preparing git commit for Vercel deployment..."
echo ""

# Step 1: Sync frontend files to public
echo "📁 Step 1: Syncing frontend files to public/..."
mkdir -p public
cp frontend/index.html public/
cp frontend/styles.css public/
cp frontend/app.js public/
cp frontend/api.js public/
cp frontend/positions.js public/
echo "✅ Frontend files synced!"
echo ""

# Step 2: Check git status
echo "📋 Step 2: Checking git status..."
git status
echo ""

# Step 3: Add all changes
echo "📦 Step 3: Adding all changes..."
git add .

# Step 4: Show what will be committed
echo ""
echo "📝 Files to be committed:"
git status --short
echo ""

# Step 5: Commit
echo "💾 Step 4: Committing changes..."
git commit -m "Fix: Add root_path=/api for Vercel routing and make team_id optional for players

- Add root_path='/api' to FastAPI app for correct Vercel routing
- Make team_id optional when creating players (nullable in database)
- Remove team validation requirement from frontend
- Add migration to make team_id nullable in players table
- Sync frontend files to public/ directory"

echo "✅ Committed!"
echo ""

# Step 6: Push
echo "🚀 Step 5: Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Vercel will automatically deploy in 1-2 minutes."
echo ""
echo "📋 Next steps:"
echo "1. Wait for Vercel deployment to complete"
echo "2. Run migration: python3 -m alembic upgrade heads"
echo "3. Test: https://green-fc.vercel.app/"

