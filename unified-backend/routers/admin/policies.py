from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid

router = APIRouter(
    prefix="/policies",
    tags=["policies"]
)

@router.get("", response_model=List[schemas.AdminPolicy])
def get_policies(type: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all policies, optionally filtered by type"""
    query = db.query(models.AdminPolicy)
    if type:
        query = query.filter(models.AdminPolicy.type == type)
    return query.all()

@router.get("/{policy_id}", response_model=schemas.AdminPolicy)
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    """Get a specific policy by ID"""
    policy = db.query(models.AdminPolicy).filter(models.AdminPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("", response_model=schemas.AdminPolicy, status_code=status.HTTP_201_CREATED)
def create_policy(policy: schemas.AdminPolicyCreate, db: Session = Depends(get_db)):
    """Create a new policy"""
    new_policy = models.AdminPolicy(
        type=policy.type,
        name=policy.name,
        value=policy.value,
        content=policy.content,
        is_active=policy.is_active
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.put("/{policy_id}", response_model=schemas.AdminPolicy)
def update_policy(policy_id: str, policy_update: schemas.AdminPolicyUpdate, db: Session = Depends(get_db)):
    """Update a policy"""
    db_policy = db.query(models.AdminPolicy).filter(models.AdminPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    if policy_update.name is not None:
        db_policy.name = policy_update.name
    if policy_update.value is not None:
        db_policy.value = policy_update.value
    if policy_update.content is not None:
        db_policy.content = policy_update.content
    if policy_update.is_active is not None:
        db_policy.is_active = policy_update.is_active
        
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    """Delete a policy"""
    db_policy = db.query(models.AdminPolicy).filter(models.AdminPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    db.delete(db_policy)
    db.commit()
    return None

def ensure_default_policies(db: Session):
    """Seed default policies if table is empty"""
    count = db.query(models.AdminPolicy).count()
    if count == 0:
        defaults = [
            {
                "type": "cancellation",
                "name": "Standard Cancellation",
                "value": "20",
                "content": "Standard 20% cancellation fee applies.",
                "is_active": True
            },
            {
                "type": "terms",
                "name": "General Terms",
                "value": None,
                "content": "1. Bookings are subject to availability.\n2. Management reserves the right to cancel.",
                "is_active": True
            }
        ]
        
        for p in defaults:
            new_policy = models.AdminPolicy(**p)
            db.add(new_policy)
        
        db.commit()
