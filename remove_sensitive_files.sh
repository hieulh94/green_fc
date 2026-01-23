#!/bin/bash

# Script to remove sensitive files from git tracking
# This script removes files from git but keeps them locally

echo "🔒 Removing sensitive files from git tracking..."
echo ""

# Remove backend.log from git tracking
if git ls-files --error-unmatch backend.log > /dev/null 2>&1; then
    echo "📝 Removing backend.log from git tracking..."
    git rm --cached backend.log
    echo "✅ backend.log removed from git tracking (file kept locally)"
else
    echo "ℹ️  backend.log is not tracked in git"
fi

echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
echo "✅ Done! Next steps:"
echo "1. Review the changes: git status"
echo "2. Commit: git commit -m 'Remove sensitive files from git tracking'"
echo "3. Push: git push origin main"
echo ""
echo "⚠️  Note: Files are still in git history. If you need to remove them completely from history,"
echo "   see REMOVE_SENSITIVE_FILES.md for instructions (not recommended unless necessary)."

