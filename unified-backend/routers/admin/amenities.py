from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
import os
from pathlib import Path
from utils import s3_utils

router = APIRouter(
    prefix="/amenities",
    tags=["amenities"]
)
from dependencies import PermissionChecker

@router.get("", response_model=List[schemas.Amenity], dependencies=[Depends(PermissionChecker("Manage Amenities", "view"))])
@router.get("/", response_model=List[schemas.Amenity], dependencies=[Depends(PermissionChecker("Manage Amenities", "view"))])
def get_all_amenities(db: Session = Depends(get_db)):
    """Get all amenities"""
    return db.query(models.Amenity).all()

@router.get("/{amenity_id}", response_model=schemas.Amenity, dependencies=[Depends(PermissionChecker("Manage Amenities", "view"))])
def get_amenity(amenity_id: str, db: Session = Depends(get_db)):
    """Get a specific amenity by ID"""
    amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    return amenity

@router.post("", response_model=schemas.Amenity, dependencies=[Depends(PermissionChecker("Manage Amenities", "add"))])
@router.post("/", response_model=schemas.Amenity, dependencies=[Depends(PermissionChecker("Manage Amenities", "add"))])
async def create_amenity(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_active: bool = Form(True),
    icon: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new amenity"""
    existing = db.query(models.Amenity).filter(models.Amenity.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Amenity with this name already exists")

    # Handle file upload
    icon_url = None
    if icon:
        try:
             print(f"DEBUG: Uploading icon for amenity: {name}")
             icon_url = await s3_utils.upload_file_to_s3(icon, folder="amenities")
             print(f"DEBUG: Icon uploaded successfully: {icon_url}")
        except Exception as e:
            print(f"Error uploading icon: {e}")
            pass

    db_amenity = models.Amenity(
        name=name,
        description=description,
        icon_url=icon_url,
        is_active=is_active
    )
    db.add(db_amenity)
    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.put("/{amenity_id}", response_model=schemas.Amenity, dependencies=[Depends(PermissionChecker("Manage Amenities", "edit"))])
async def update_amenity(
    amenity_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_active: bool = Form(True),
    is_icon_removed: bool = Form(False),
    icon: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update an amenity"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")

    # Handle file upload
    if icon:
        # We replace the icon. Ideally we should delete the old one from S3 but for now we just overwrite the URL in DB.
        try:
            db_amenity.icon_url = await s3_utils.upload_file_to_s3(icon, folder="amenities")
        except Exception as e:
             print(f"Error uploading icon: {e}")
             pass
    elif is_icon_removed:
        print(f"Removing icon for amenity {amenity_id}")
        db_amenity.icon_url = None

    db_amenity.name = name
    db_amenity.description = description
    db_amenity.is_active = is_active

    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.patch("/{amenity_id}/toggle", response_model=schemas.Amenity, dependencies=[Depends(PermissionChecker("Manage Amenities", "edit"))])
def toggle_amenity_status(amenity_id: str, db: Session = Depends(get_db)):
    """Toggle amenity active status"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    db_amenity.is_active = not db_amenity.is_active
    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.delete("/{amenity_id}", dependencies=[Depends(PermissionChecker("Manage Amenities", "delete"))])
def delete_amenity(amenity_id: str, db: Session = Depends(get_db)):
    """Delete an amenity"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    db.delete(db_amenity)
    db.commit()
    return {"message": "Amenity deleted successfully"}
