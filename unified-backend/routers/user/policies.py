from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database

router = APIRouter(
    prefix="/policies",
    tags=["policies"]
)

@router.get("/", response_model=List[schemas.AdminPolicy])
def get_public_policies(type: Optional[str] = None, db: Session = Depends(database.get_db)):
    """Fetch active policies for users"""
    query = db.query(models.AdminPolicy).filter(models.AdminPolicy.is_active == True)
    if type:
        query = query.filter(models.AdminPolicy.type == type)
    return query.all()

@router.get("/privacy-policy", response_model=schemas.AdminPolicy)
def get_privacy_policy(db: Session = Depends(database.get_db)):
    """Fetch the active privacy policy"""
    policy = db.query(models.AdminPolicy).filter(
        models.AdminPolicy.type == "privacy",
        models.AdminPolicy.is_active == True
    ).first()
    
    if not policy:
        # Fallback to general terms if specific privacy policy not found
        policy = db.query(models.AdminPolicy).filter(
            models.AdminPolicy.type == "terms",
            models.AdminPolicy.is_active == True
        ).first()
        
    if not policy:
        raise HTTPException(status_code=404, detail="Privacy policy not found")
        
    return policy
