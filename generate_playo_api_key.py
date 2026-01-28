#!/usr/bin/env python3
"""
Script to generate X-API-Key tokens for Playo API integration
"""

import sys
import os
import hashlib
import secrets
from datetime import datetime
from sqlalchemy.orm import Session

# Add the unified-backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'unified-backend'))

from database import get_db
from models import PlayoAPIKey
from uuid import uuid4

def generate_api_key():
    """Generate a secure random API key"""
    # Generate a 32-byte (256-bit) random token
    token = secrets.token_urlsafe(32)
    return token

def hash_token(token: str) -> str:
    """Hash token for secure storage and comparison"""
    return hashlib.sha256(token.encode()).hexdigest()

def create_playo_api_key(description: str = "Generated for Playo Integration"):
    """
    Create a new Playo API key and store it in the database
    
    Returns:
        tuple: (plain_token, token_hash)
    """
    # Generate a secure random token
    plain_token = generate_api_key()
    token_hash = hash_token(plain_token)
    
    # Create database session
    db = next(get_db())
    
    try:
        # Create new API key record
        api_key = PlayoAPIKey(
            id=uuid4(),
            token_hash=token_hash,
            description=description,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(api_key)
        db.commit()
        
        print("✅ Playo API Key created successfully!")
        print(f"🔑 Plain Token (X-API-Key header value): {plain_token}")
        print(f"📝 Description: {description}")
        print(f"🆔 Token Hash (stored in DB): {token_hash}")
        print(f"📅 Created: {datetime.utcnow()}")
        print()
        print("📋 Usage:")
        print(f"   curl -X POST 'http://localhost:8000/api/playo/orders' \\")
        print(f"        -H 'X-API-Key: {plain_token}' \\")
        print(f"        -H 'Content-Type: application/json' \\")
        print(f"        -d '{{\"venueId\": \"your-venue-uuid\", ...}}'")
        
        return plain_token, token_hash
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating API key: {e}")
        return None, None
    finally:
        db.close()

def list_existing_keys():
    """List all existing Playo API keys"""
    db = next(get_db())
    
    try:
        keys = db.query(PlayoAPIKey).all()
        
        if not keys:
            print("📝 No Playo API keys found in the database.")
            return
        
        print(f"📋 Found {len(keys)} Playo API key(s):")
        print()
        
        for key in keys:
            status = "✅ Active" if key.is_active else "❌ Inactive"
            print(f"🆔 ID: {key.id}")
            print(f"📝 Description: {key.description or 'No description'}")
            print(f"🔑 Token Hash: {key.token_hash}")
            print(f"📊 Status: {status}")
            print(f"📅 Created: {key.created_at}")
            print(f"🕐 Last Used: {key.last_used_at or 'Never'}")
            print("-" * 50)
            
    except Exception as e:
        print(f"❌ Error listing API keys: {e}")
    finally:
        db.close()

def deactivate_key(key_id: str):
    """Deactivate a Playo API key"""
    db = next(get_db())
    
    try:
        key = db.query(PlayoAPIKey).filter(PlayoAPIKey.id == key_id).first()
        
        if not key:
            print(f"❌ API key with ID {key_id} not found.")
            return
        
        key.is_active = False
        db.commit()
        
        print(f"✅ API key {key_id} has been deactivated.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deactivating API key: {e}")
    finally:
        db.close()

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("🚀 Playo API Key Generator")
        print("=" * 40)
        print()
        print("Usage:")
        print("  python generate_playo_api_key.py create [description]")
        print("  python generate_playo_api_key.py list")
        print("  python generate_playo_api_key.py deactivate <key_id>")
        print()
        print("Commands:")
        print("  create      - Generate a new Playo API key")
        print("  list        - List all existing API keys")
        print("  deactivate  - Deactivate an API key")
        print()
        print("Examples:")
        print("  python generate_playo_api_key.py create 'Production API Key'")
        print("  python generate_playo_api_key.py list")
        print("  python generate_playo_api_key.py deactivate 123e4567-e89b-12d3-a456-426614174000")
        return
    
    command = sys.argv[1].lower()
    
    if command == "create":
        description = sys.argv[2] if len(sys.argv) > 2 else "Generated for Playo Integration"
        create_playo_api_key(description)
        
    elif command == "list":
        list_existing_keys()
        
    elif command == "deactivate":
        if len(sys.argv) < 3:
            print("❌ Please provide a key ID to deactivate")
            print("Usage: python generate_playo_api_key.py deactivate <key_id>")
            return
        
        key_id = sys.argv[2]
        deactivate_key(key_id)
        
    else:
        print(f"❌ Unknown command: {command}")
        print("Available commands: create, list, deactivate")

if __name__ == "__main__":
    main()