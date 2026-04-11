from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db
from dependencies import PermissionChecker
import hashlib

router = APIRouter(
    prefix="/integrations",
    tags=["integrations"]
)

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

@router.get("/partners", response_model=List[schemas.Partner])
@router.get("/partners/", response_model=List[schemas.Partner])
def get_partners(
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Integrations", "view"))
):
    """Get all integration partners"""
    return db.query(models.Partner).all()

@router.put("/partners/{partner_id}", response_model=schemas.Partner)
def update_partner(
    partner_id: str,
    partner_update: schemas.PartnerUpdate,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Integrations", "edit"))
):
    """Update a partner's configuration or toggle status"""
    db_partner = db.query(models.Partner).filter(models.Partner.id == partner_id).first()
    if not db_partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    if partner_update.name:
        db_partner.name = partner_update.name
    if partner_update.webhook_url is not None:
        db_partner.webhook_url = partner_update.webhook_url
    if partner_update.is_active is not None:
        db_partner.is_active = partner_update.is_active
    if partner_update.api_key:
        db_partner.api_key_hash = hash_api_key(partner_update.api_key)
        
    db.commit()
    db.refresh(db_partner)
    return db_partner

@router.post("/partners", response_model=schemas.Partner)
@router.post("/partners/", response_model=schemas.Partner)
def create_partner(
    partner: schemas.PartnerBase,
    api_key: str,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Integrations", "add"))
):
    """Register a new integration partner"""
    db_partner = models.Partner(
        name=partner.name,
        unique_id=partner.unique_id,
        webhook_url=partner.webhook_url,
        is_active=partner.is_active,
        api_key_hash=hash_api_key(api_key)
    )
    db.add(db_partner)
    db.commit()
    db.refresh(db_partner)
    return db_partner
