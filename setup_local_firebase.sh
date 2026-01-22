#!/bin/bash

# Script to setup Firebase for local development
# This script will help you configure Firebase to use the same project as production

set -e  # Exit on error

echo "🔥 Setting up Firebase for local development..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will help you connect local development to Firebase${NC}"
echo -e "${BLUE}   (same Firebase project as production)${NC}"
echo ""

# Check if .env file exists
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to update it? (y/N): " update_env
    if [[ ! $update_env =~ ^[Yy]$ ]]; then
        echo "Skipping .env update"
        echo ""
        echo "Please manually set these variables in .env:"
        echo "  FIREBASE_PROJECT_ID=your-project-id"
        echo "  FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json"
        echo "  ENVIRONMENT=development"
        exit 0
    fi
fi

echo ""
echo "📝 Step 1: Firebase Project ID"
echo ""
echo "Please provide your Firebase Project ID"
echo "(You can find it in Firebase Console > Project Settings > General)"
echo ""
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo -e "${RED}❌ Firebase Project ID is required${NC}"
    exit 1
fi

echo ""
echo "📝 Step 2: Firebase Credentials File"
echo ""
echo "You need to download Firebase Service Account credentials:"
echo ""
echo "1. Go to Firebase Console: https://console.firebase.google.com/"
echo "2. Select your project: $FIREBASE_PROJECT_ID"
echo "3. Go to Project Settings (⚙️) > Service Accounts"
echo "4. Click 'Generate New Private Key'"
echo "5. Save the downloaded JSON file"
echo ""
read -p "Path to firebase-credentials.json file (or press Enter to use ./firebase-credentials.json): " CREDENTIALS_PATH
CREDENTIALS_PATH=${CREDENTIALS_PATH:-./firebase-credentials.json}

# Check if credentials file exists
if [ ! -f "$CREDENTIALS_PATH" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Credentials file not found at: $CREDENTIALS_PATH${NC}"
    echo ""
    echo "Please download the credentials file first:"
    echo "1. Firebase Console > Project Settings > Service Accounts"
    echo "2. Click 'Generate New Private Key'"
    echo "3. Save as: $CREDENTIALS_PATH"
    echo ""
    read -p "Press Enter after you've downloaded the file, or 'q' to quit: " wait_input
    if [[ "$wait_input" == "q" ]]; then
        exit 1
    fi
    
    # Check again
    if [ ! -f "$CREDENTIALS_PATH" ]; then
        echo -e "${RED}❌ Credentials file still not found${NC}"
        exit 1
    fi
fi

# Validate JSON file
if ! python3 -m json.tool "$CREDENTIALS_PATH" > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid JSON file: $CREDENTIALS_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Credentials file found and valid${NC}"

# Get absolute path
CREDENTIALS_ABS_PATH=$(cd "$(dirname "$CREDENTIALS_PATH")" && pwd)/$(basename "$CREDENTIALS_PATH")

# Update or create .env file
echo ""
echo "📝 Creating/updating .env file..."

if [ -f "$ENV_FILE" ]; then
    # Update existing .env file
    # Remove old Firebase settings if they exist
    # Also remove DATABASE_URL (from old PostgreSQL setup) to avoid conflicts
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/^FIREBASE_PROJECT_ID=/d' "$ENV_FILE"
        sed -i '' '/^FIREBASE_CREDENTIALS_PATH=/d' "$ENV_FILE"
        sed -i '' '/^FIREBASE_CREDENTIALS=/d' "$ENV_FILE"
        sed -i '' '/^ENVIRONMENT=/d' "$ENV_FILE"
        sed -i '' '/^DATABASE_URL=/d' "$ENV_FILE"  # Remove old PostgreSQL config
    else
        # Linux
        sed -i '/^FIREBASE_PROJECT_ID=/d' "$ENV_FILE"
        sed -i '/^FIREBASE_CREDENTIALS_PATH=/d' "$ENV_FILE"
        sed -i '/^FIREBASE_CREDENTIALS=/d' "$ENV_FILE"
        sed -i '/^ENVIRONMENT=/d' "$ENV_FILE"
        sed -i '/^DATABASE_URL=/d' "$ENV_FILE"  # Remove old PostgreSQL config
    fi
    echo "" >> "$ENV_FILE"
else
    # Create new .env file
    touch "$ENV_FILE"
fi

# Add Firebase configuration
cat >> "$ENV_FILE" << EOF

# Firebase Configuration (Local Development)
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_CREDENTIALS_PATH=$CREDENTIALS_ABS_PATH
ENVIRONMENT=development
EOF

echo -e "${GREEN}✅ .env file updated${NC}"

# Check if firebase-credentials.json is in .gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q "firebase-credentials.json" .gitignore; then
        echo "" >> .gitignore
        echo "# Firebase credentials (DO NOT COMMIT!)" >> .gitignore
        echo "firebase-credentials.json" >> .gitignore
        echo -e "${GREEN}✅ Added firebase-credentials.json to .gitignore${NC}"
    fi
else
    echo "firebase-credentials.json" > .gitignore
    echo -e "${GREEN}✅ Created .gitignore with firebase-credentials.json${NC}"
fi

echo ""
echo "🧪 Testing Firebase connection..."
echo ""

# Test Firebase connection
python3 << EOF
import os
import sys
import json
import traceback

try:
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✅ Loaded .env file")
    except ImportError:
        print("⚠️  python-dotenv not available, using system env vars")
    except Exception as e:
        print(f"⚠️  Could not load .env: {e}")
    
    # Check environment variables
    print("🔍 Checking environment variables...")
    firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    if not firebase_project_id:
        print("❌ FIREBASE_PROJECT_ID is not set")
        print("   Please check your .env file")
        sys.exit(1)
    print(f"   ✅ FIREBASE_PROJECT_ID: {firebase_project_id}")
    
    if not firebase_credentials_path:
        print("❌ FIREBASE_CREDENTIALS_PATH is not set")
        print("   Please check your .env file")
        sys.exit(1)
    print(f"   ✅ FIREBASE_CREDENTIALS_PATH: {firebase_credentials_path}")
    
    # Check if credentials file exists
    if not os.path.exists(firebase_credentials_path):
        print(f"❌ Credentials file not found: {firebase_credentials_path}")
        print("   Please check the path in .env file")
        sys.exit(1)
    print(f"   ✅ Credentials file exists")
    
    # Validate JSON
    try:
        with open(firebase_credentials_path, 'r') as f:
            cred_data = json.load(f)
        print(f"   ✅ Credentials file is valid JSON")
        if 'project_id' in cred_data:
            print(f"   ✅ Project ID in credentials: {cred_data['project_id']}")
            if cred_data['project_id'] != firebase_project_id:
                print(f"   ⚠️  Warning: Project ID mismatch!")
                print(f"      .env: {firebase_project_id}")
                print(f"      credentials: {cred_data['project_id']}")
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in credentials file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading credentials file: {e}")
        sys.exit(1)
    
    # Try to import and initialize
    print("")
    print("📡 Importing Firebase modules...")
    try:
        from app.config import settings
        from app.database import initialize_firebase
        print("   ✅ Modules imported successfully")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("")
        print("   Please install dependencies:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    print("")
    print("🔥 Initializing Firebase...")
    try:
        db = initialize_firebase()
        
        if db is None:
            print("❌ Failed to initialize Firebase (returned None)")
            sys.exit(1)
        
        print("✅ Firebase initialized successfully!")
        print(f"   Project ID: {settings.firebase_project_id}")
        
        # Try to access Firestore
        print("")
        print("🧪 Testing Firestore access...")
        try:
            collections = list(db.collections())
            print(f"   ✅ Can access Firestore")
            if collections:
                print(f"   Found {len(collections)} collection(s):")
                for col in collections[:5]:  # Show first 5
                    print(f"      - {col.id}")
                if len(collections) > 5:
                    print(f"      ... and {len(collections) - 5} more")
            else:
                print("   ℹ️  No collections found (database is empty)")
        except Exception as e:
            print(f"   ⚠️  Connection works but may have permission issues")
            print(f"   Error: {str(e)}")
            print("   (This is normal if database is empty or rules are strict)")
            print("   Firebase connection is working, but you may need to check permissions")
    
    except ValueError as e:
        print(f"❌ Firebase initialization failed: {e}")
        print("")
        print("Troubleshooting:")
        print("1. Check FIREBASE_PROJECT_ID matches your Firebase project")
        print("2. Check firebase-credentials.json is valid and from the same project")
        print("3. Ensure Service Account has Firestore permissions")
        print("4. Check Firebase Console > Firestore Database is enabled")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print("")
        print("Full error details:")
        traceback.print_exc()
        sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print("")
    print("Full error details:")
    traceback.print_exc()
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo "Your local environment is now connected to Firebase:"
    echo "  Project: $FIREBASE_PROJECT_ID"
    echo "  Credentials: $CREDENTIALS_ABS_PATH"
    echo ""
    echo "Next steps:"
    echo "  1. Start your application:"
    echo "     uvicorn app.main:app --reload"
    echo ""
    echo "  2. Or use the run script:"
    echo "     ./run.sh"
    echo ""
    echo "  3. Access API documentation:"
    echo "     http://localhost:8000/docs"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
    echo "  - Local and production now use the SAME Firebase database"
    echo "  - Be careful when testing - changes will affect production data!"
    echo "  - Consider using Firebase Emulator for safer local development"
    echo ""
else
    echo -e "${RED}❌ Setup failed${NC}"
    exit 1
fi

