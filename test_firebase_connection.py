#!/usr/bin/env python3
"""
Quick script to test Firebase connection
Run this to debug Firebase setup issues
"""

import os
import sys
import json
import traceback

def test_firebase():
    print("🔥 Testing Firebase Connection...")
    print("=" * 50)
    print()
    
    # Step 1: Check .env file
    print("Step 1: Checking .env file...")
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"   ✅ .env file exists")
        with open(env_file, 'r') as f:
            env_content = f.read()
            if "FIREBASE_PROJECT_ID" in env_content:
                print("   ✅ FIREBASE_PROJECT_ID found in .env")
            else:
                print("   ❌ FIREBASE_PROJECT_ID not found in .env")
            if "FIREBASE_CREDENTIALS_PATH" in env_content:
                print("   ✅ FIREBASE_CREDENTIALS_PATH found in .env")
            else:
                print("   ❌ FIREBASE_CREDENTIALS_PATH not found in .env")
    else:
        print(f"   ❌ .env file not found at: {env_file}")
        return False
    print()
    
    # Step 2: Load environment variables
    print("Step 2: Loading environment variables...")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("   ✅ Loaded .env file")
    except ImportError:
        print("   ⚠️  python-dotenv not installed, using system env vars")
    except Exception as e:
        print(f"   ❌ Error loading .env: {e}")
        return False
    
    firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    if not firebase_project_id:
        print("   ❌ FIREBASE_PROJECT_ID is not set")
        return False
    print(f"   ✅ FIREBASE_PROJECT_ID: {firebase_project_id}")
    
    if not firebase_credentials_path:
        print("   ❌ FIREBASE_CREDENTIALS_PATH is not set")
        return False
    print(f"   ✅ FIREBASE_CREDENTIALS_PATH: {firebase_credentials_path}")
    print()
    
    # Step 3: Check credentials file
    print("Step 3: Checking credentials file...")
    if not os.path.exists(firebase_credentials_path):
        print(f"   ❌ File not found: {firebase_credentials_path}")
        print(f"   Current directory: {os.getcwd()}")
        return False
    print(f"   ✅ File exists: {firebase_credentials_path}")
    
    try:
        with open(firebase_credentials_path, 'r') as f:
            cred_data = json.load(f)
        print("   ✅ Valid JSON file")
        
        required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        missing_fields = [f for f in required_fields if f not in cred_data]
        if missing_fields:
            print(f"   ❌ Missing required fields: {', '.join(missing_fields)}")
            return False
        print("   ✅ All required fields present")
        
        if cred_data.get('project_id') != firebase_project_id:
            print(f"   ⚠️  Warning: Project ID mismatch!")
            print(f"      .env: {firebase_project_id}")
            print(f"      credentials: {cred_data.get('project_id')}")
        else:
            print(f"   ✅ Project ID matches: {firebase_project_id}")
            
    except json.JSONDecodeError as e:
        print(f"   ❌ Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error reading file: {e}")
        return False
    print()
    
    # Step 4: Test imports
    print("Step 4: Testing Python imports...")
    try:
        import firebase_admin
        print("   ✅ firebase-admin installed")
    except ImportError:
        print("   ❌ firebase-admin not installed")
        print("   Run: pip install firebase-admin")
        return False
    
    try:
        from app.config import settings
        print("   ✅ app.config imported")
    except ImportError as e:
        print(f"   ❌ Failed to import app.config: {e}")
        return False
    
    try:
        from app.database import initialize_firebase
        print("   ✅ app.database imported")
    except ImportError as e:
        print(f"   ❌ Failed to import app.database: {e}")
        return False
    print()
    
    # Step 5: Initialize Firebase
    print("Step 5: Initializing Firebase...")
    try:
        # Reset Firebase if already initialized
        if firebase_admin._apps:
            print("   ℹ️  Firebase already initialized, resetting...")
            firebase_admin.delete_app(firebase_admin.get_app())
        
        db = initialize_firebase()
        
        if db is None:
            print("   ❌ initialize_firebase() returned None")
            return False
        
        print("   ✅ Firebase initialized successfully!")
        print(f"   Project: {settings.firebase_project_id}")
        print()
        
        # Step 6: Test Firestore access
        print("Step 6: Testing Firestore access...")
        try:
            collections = list(db.collections())
            print(f"   ✅ Can access Firestore")
            print(f"   Found {len(collections)} collection(s)")
            if collections:
                print("   Collections:")
                for col in collections[:10]:
                    print(f"      - {col.id}")
                if len(collections) > 10:
                    print(f"      ... and {len(collections) - 10} more")
            return True
        except Exception as e:
            print(f"   ⚠️  Connection works but access test failed: {e}")
            print("   This might be a permissions issue")
            print("   Firebase is initialized, but you may need to check Firestore permissions")
            return True  # Still consider it a success if initialized
        
    except ValueError as e:
        print(f"   ❌ Initialization failed: {e}")
        print()
        print("   Common issues:")
        print("   1. Project ID doesn't match credentials")
        print("   2. Credentials file is invalid or corrupted")
        print("   3. Service Account doesn't have Firestore permissions")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        print()
        print("   Full traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_firebase()
    print()
    print("=" * 50)
    if success:
        print("✅ Firebase connection test PASSED!")
        sys.exit(0)
    else:
        print("❌ Firebase connection test FAILED!")
        print()
        print("Please check the errors above and fix them.")
        sys.exit(1)

