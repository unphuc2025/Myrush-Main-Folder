"""
Generate API token for Playo integration
Run this script to create a secure Bearer token for Playo
"""

import secrets
import hashlib
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

def hash_token(token: str) -> str:
    """Hash token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

def generate_playo_token(description: str = "Playo Production Token"):
    """Generate and store a new API token for Playo"""
    
    print("=" * 60)
    print("PLAYO API TOKEN GENERATOR")
    print("=" * 60)
    
    # Generate secure token (256-bit)
    token = secrets.token_urlsafe(32)
    token_hash = hash_token(token)
    
    # Store in database
    db = SessionLocal()
    try:
        # Check if token already exists
        existing = db.query(models.PlayoAPIKey).filter(
            models.PlayoAPIKey.description == description
        ).first()
        
        if existing:
            print(f"\n⚠️  A token with description '{description}' already exists.")
            response = input("Do you want to deactivate it and create a new one? (yes/no): ").strip().lower()
            
            if response == "yes":
                existing.is_active = False
                db.commit()
                print("✅ Old token deactivated")
            else:
                print("\nToken generation cancelled.")
                return None
        
        # Create new token
        api_key = models.PlayoAPIKey(
            token_hash=token_hash,
            description=description,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(api_key)
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ TOKEN GENERATED SUCCESSFULLY")
        print("=" * 60)
        print(f"\nDescription: {description}")
        print(f"Token ID: {api_key.id}")
        print(f"Created: {api_key.created_at}")
        print("\n" + "=" * 60)
        print("🔑 BEARER TOKEN (Share this with Playo team):")
        print("=" * 60)
        print(f"\n{token}\n")
        print("=" * 60)
        print("\n⚠️  IMPORTANT:")
        print("  1. Copy this token NOW - it won't be shown again!")
        print("  2. Share it securely with the Playo team")
        print("  3. They should use it in the Authorization header:")
        print(f"     Authorization: Bearer {token}")
        print("\n" + "=" * 60)
        
        return token
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error generating token: {str(e)}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("\nThis will generate a new API token for Playo integration.\n")
    
    description = input("Enter token description (default: 'Playo Production Token'): ").strip()
    if not description:
        description = "Playo Production Token"
    
    token = generate_playo_token(description)
    
    if token:
        # Save to file for backup
        with open("playo_token.txt", "w") as f:
            f.write(f"Playo API Token\n")
            f.write(f"Generated: {datetime.utcnow()}\n")
            f.write(f"Description: {description}\n")
            f.write(f"\nToken:\n{token}\n")
            f.write(f"\nAuthorization Header:\nAuthorization: Bearer {token}\n")
        
        print(f"\n💾 Token also saved to: playo_token.txt")
        print("   (Keep this file secure!)\n")
