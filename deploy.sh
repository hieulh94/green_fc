#!/bin/bash

echo "🚀 Preparing deployment to Vercel..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "⚠️  .gitignore not found, creating one..."
    # .gitignore already exists, so this won't run
fi

# Add all files
echo "📝 Staging files..."
git add .

# Check if there are changes
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Prepare for Vercel deployment"
    echo "✅ Changes committed"
fi

# Check if remote exists
if ! git remote | grep -q "origin"; then
    echo ""
    echo "⚠️  No remote repository found!"
    echo "Please add your GitHub repository:"
    echo "  git remote add origin https://github.com/yourusername/your-repo.git"
    echo "  git push -u origin main"
    echo ""
else
    echo "📤 Pushing to remote..."
    git push origin main || git push origin master
    echo "✅ Code pushed to remote"
fi

echo ""
echo "✅ Preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Click 'Add New Project'"
echo "3. Import your GitHub repository"
echo "4. Add environment variables:"
echo "   - DATABASE_URL: your_postgresql_connection_string"
echo "   - ENVIRONMENT: production"
echo "5. Click 'Deploy'"
echo ""
echo "🔧 After deployment, run migrations:"
echo "   vercel env pull .env.local"
echo "   alembic upgrade head"

