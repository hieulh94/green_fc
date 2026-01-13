#!/bin/bash

# Quick deploy script for Vercel

echo "🚀 Preparing deployment to Vercel..."
echo ""

# Step 1: Sync frontend files
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

# Step 3: Instructions
echo "📝 Next steps:"
echo ""
echo "1. Run migration (IMPORTANT!):"
echo "   export DATABASE_URL=\"postgresql://postgres.btbadzadbfjjdstmrrmb:mMoJUH93lEI0djB0@aws-1-ap-south-1.pooler.supabase.com:5432/postgres\""
echo "   python3 -m alembic upgrade heads"
echo ""
echo "2. Commit and push:"
echo "   git add ."
echo "   git commit -m \"Fix: Add root_path=/api and make team_id optional for players\""
echo "   git push origin main"
echo ""
echo "3. Vercel will auto-deploy (wait 1-2 minutes)"
echo ""
echo "✅ Ready to deploy!"

