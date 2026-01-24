"""
Admin API endpoints for Playo token management
Allows admins to view and regenerate Playo API tokens
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets
import hashlib
from datetime import datetime
import models, schemas, database
from dependencies import require_super_admin

router = APIRouter(
    prefix="/playo-tokens",
    tags=["Admin Playo Tokens"],
)

def hash_token(token: str) -> str:
    """Hash token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

@router.get("/")
async def get_playo_tokens(
    admin: models.Admin = Depends(require_super_admin),
    db: Session = Depends(database.get_db)
):
    """
    Get all Playo API tokens (without revealing actual tokens)
    Only shows metadata: id, description, is_active, created_at, last_used_at
    """
    
    tokens = db.query(models.PlayoAPIKey).order_by(
        models.PlayoAPIKey.created_at.desc()
    ).all()
    
    return {
        "tokens": [
            {
                "id": str(token.id),
                "description": token.description,
                "is_active": token.is_active,
                "created_at": token.created_at,
                "last_used_at": token.last_used_at,
                "token_preview": "••••••••" + token.token_hash[-8:]  # Show last 8 chars of hash
            }
            for token in tokens
        ]
    }

@router.post("/generate")
async def generate_playo_token(
    description: str = "Playo Production Token",
    admin: models.Admin = Depends(require_super_admin),
    db: Session = Depends(database.get_db)
):
    """
    Generate a new Playo API token
    Returns the actual token (only shown once!)
    """
    
    # Generate secure token (256-bit)
    token = secrets.token_urlsafe(32)
    token_hash = hash_token(token)
    
    # Deactivate existing tokens with same description
    existing = db.query(models.PlayoAPIKey).filter(
        models.PlayoAPIKey.description == description,
        models.PlayoAPIKey.is_active == True
    ).all()
    
    for old_token in existing:
        old_token.is_active = False
    
    # Create new token
    api_key = models.PlayoAPIKey(
        token_hash=token_hash,
        description=description,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    return {
        "success": True,
        "message": "Token generated successfully",
        "token": token,  # Only shown once!
        "token_id": str(api_key.id),
        "description": description,
        "authorization_header": f"Bearer {token}",
        "warning": "⚠️ Save this token now! It won't be shown again."
    }

@router.post("/{token_id}/deactivate")
async def deactivate_token(
    token_id: str,
    admin: models.Admin = Depends(require_super_admin),
    db: Session = Depends(database.get_db)
):
    """
    Deactivate a Playo API token
    """
    
    token = db.query(models.PlayoAPIKey).filter(
        models.PlayoAPIKey.id == token_id
    ).first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    token.is_active = False
    db.commit()
    
    return {
        "success": True,
        "message": "Token deactivated successfully"
    }

@router.post("/{token_id}/activate")
async def activate_token(
    token_id: str,
    admin: models.Admin = Depends(require_super_admin),
    db: Session = Depends(database.get_db)
):
    """
    Reactivate a Playo API token
    """
    
    token = db.query(models.PlayoAPIKey).filter(
        models.PlayoAPIKey.id == token_id
    ).first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    token.is_active = True
    db.commit()
    
    return {
        "success": True,
        "message": "Token activated successfully"
    }

@router.delete("/{token_id}")
async def delete_token(
    token_id: str,
    admin: models.Admin = Depends(require_super_admin),
    db: Session = Depends(database.get_db)
):
    """
    Permanently delete a Playo API token
    """
    
    token = db.query(models.PlayoAPIKey).filter(
        models.PlayoAPIKey.id == token_id
    ).first()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    db.delete(token)
    db.commit()
    
    return {
        "success": True,
        "message": "Token deleted successfully"
    }
