from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
import os
import shutil
from pathlib import Path

router = APIRouter(
    prefix="/amenities",
    tags=["amenities"]
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/amenities")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("", response_model=List[schemas.Amenity])
@router.get("/", response_model=List[schemas.Amenity])
def get_all_amenities(db: Session = Depends(get_db)):
    """Get all amenities"""
    return db.query(models.Amenity).all()

@router.get("/{amenity_id}", response_model=schemas.Amenity)
def get_amenity(amenity_id: str, db: Session = Depends(get_db)):
    """Get a specific amenity by ID"""
    amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    return amenity

@router.post("", response_model=schemas.Amenity)
@router.post("/", response_model=schemas.Amenity)
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
        # Generate unique filename
        file_extension = os.path.splitext(icon.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(icon.file, buffer)

        icon_url = f"/uploads/amenities/{unique_filename}"

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

@router.put("/{amenity_id}", response_model=schemas.Amenity)
async def update_amenity(
    amenity_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_active: bool = Form(True),
    icon: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update an amenity"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")

    # Handle file upload
    if icon:
        # Delete old icon if exists
        if db_amenity.icon_url:
            old_file_path = Path(db_amenity.icon_url.lstrip('/'))
            if old_file_path.exists():
                old_file_path.unlink()

        # Generate unique filename
        file_extension = os.path.splitext(icon.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(icon.file, buffer)

        db_amenity.icon_url = f"/uploads/amenities/{unique_filename}"

    db_amenity.name = name
    db_amenity.description = description
    db_amenity.is_active = is_active

    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.patch("/{amenity_id}/toggle", response_model=schemas.Amenity)
def toggle_amenity_status(amenity_id: str, db: Session = Depends(get_db)):
    """Toggle amenity active status"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    db_amenity.is_active = not db_amenity.is_active
    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.delete("/{amenity_id}")
def delete_amenity(amenity_id: str, db: Session = Depends(get_db)):
    """Delete an amenity"""
    db_amenity = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    db.delete(db_amenity)
    db.commit()
    return {"message": "Amenity deleted successfully"}
