from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
import os
import shutil
import json
from pathlib import Path

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/branches")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(
    prefix="/branches",
    tags=["branches"]
)

@router.get("", response_model=List[schemas.Branch])
@router.get("/", response_model=List[schemas.Branch])
def get_all_branches(city_id: str = None, area_id: str = None, db: Session = Depends(get_db)):
    """Get all branches, optionally filtered by city_id or area_id"""
    query = db.query(models.Branch)
    if city_id:
        query = query.filter(models.Branch.city_id == city_id)
    if area_id:
        query = query.filter(models.Branch.area_id == area_id)
    return query.all()

@router.get("/{branch_id}", response_model=schemas.Branch)
def get_branch(branch_id: str, db: Session = Depends(get_db)):
    """Get a specific branch by ID"""
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("", response_model=schemas.Branch)
@router.post("/", response_model=schemas.Branch)
async def create_branch(
    name: str = Form(...),
    city_id: str = Form(...),
    area_id: str = Form(...),
    search_location: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    ground_overview: Optional[str] = Form(None),
    ground_type: str = Form("single"),
    opening_hours: Optional[str] = Form(None),
    is_active: bool = Form(True),
    game_types: Optional[List[str]] = Form(None),
    amenities: Optional[List[str]] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new branch with file uploads"""
    # Handle image uploads
    image_urls = []
    if images:
        for image in images:
            file_extension = os.path.splitext(image.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename

            with file_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            image_urls.append(f"/uploads/branches/{unique_filename}")

    # Parse opening hours if provided
    opening_hours_data = None
    if opening_hours:
        try:
            opening_hours_data = json.loads(opening_hours)
        except json.JSONDecodeError:
            opening_hours_data = None

    # Create branch
    db_branch = models.Branch(
        name=name,
        city_id=city_id,
        area_id=area_id,
        search_location=search_location,
        address_line1=address_line1,
        address_line2=address_line2,
        ground_overview=ground_overview,
        ground_type=ground_type,
        images=image_urls if image_urls else None,
        opening_hours=opening_hours_data,
        is_active=is_active
    )
    db.add(db_branch)
    db.flush()  # Flush to get the branch ID

    # Add game types relationships
    if game_types:
        for game_type_id in game_types:
            db_branch_game = models.BranchGameType(
                branch_id=db_branch.id,
                game_type_id=game_type_id
            )
            db.add(db_branch_game)

    # Add amenities relationships
    if amenities:
        for amenity_id in amenities:
            db_branch_amenity = models.BranchAmenity(
                branch_id=db_branch.id,
                amenity_id=amenity_id
            )
            db.add(db_branch_amenity)

    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.put("/{branch_id}", response_model=schemas.Branch)
async def update_branch(
    branch_id: str,
    name: str = Form(...),
    city_id: str = Form(...),
    area_id: str = Form(...),
    search_location: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    ground_overview: Optional[str] = Form(None),
    ground_type: str = Form("single"),
    opening_hours: Optional[str] = Form(None),
    is_active: bool = Form(True),
    game_types: Optional[List[str]] = Form(None),
    amenities: Optional[List[str]] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    existing_images: Optional[List[str]] = Form(None),
    db: Session = Depends(get_db)
):
    """Update a branch with file uploads"""
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Handle image uploads
    image_urls = existing_images if existing_images else []

    # Delete old images that are not in existing_images
    if db_branch.images:
        for old_image_url in db_branch.images:
            if old_image_url not in image_urls:
                # Extract filename from URL and delete file
                filename = old_image_url.split('/')[-1]
                file_path = UPLOAD_DIR / filename
                if file_path.exists():
                    file_path.unlink()

    # Add new uploaded images
    if images:
        for image in images:
            file_extension = os.path.splitext(image.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename

            with file_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            image_urls.append(f"/uploads/branches/{unique_filename}")

    # Parse opening hours if provided
    opening_hours_data = None
    if opening_hours:
        try:
            opening_hours_data = json.loads(opening_hours)
        except json.JSONDecodeError:
            opening_hours_data = None

    # Update branch fields
    db_branch.name = name
    db_branch.city_id = city_id
    db_branch.area_id = area_id
    db_branch.search_location = search_location
    db_branch.address_line1 = address_line1
    db_branch.address_line2 = address_line2
    db_branch.ground_overview = ground_overview
    db_branch.ground_type = ground_type
    db_branch.images = image_urls if image_urls else None
    db_branch.opening_hours = opening_hours_data
    db_branch.is_active = is_active

    # Update game types relationships
    # First, delete existing relationships
    db.query(models.BranchGameType).filter(models.BranchGameType.branch_id == branch_id).delete()
    if game_types:
        for game_type_id in game_types:
            db_branch_game = models.BranchGameType(
                branch_id=branch_id,
                game_type_id=game_type_id
            )
            db.add(db_branch_game)

    # Update amenities relationships
    # First, delete existing relationships
    db.query(models.BranchAmenity).filter(models.BranchAmenity.branch_id == branch_id).delete()
    if amenities:
        for amenity_id in amenities:
            db_branch_amenity = models.BranchAmenity(
                branch_id=branch_id,
                amenity_id=amenity_id
            )
            db.add(db_branch_amenity)

    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.patch("/{branch_id}/toggle", response_model=schemas.Branch)
def toggle_branch_status(branch_id: str, db: Session = Depends(get_db)):
    """Toggle branch active status"""
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db_branch.is_active = not db_branch.is_active
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/{branch_id}")
def delete_branch(branch_id: str, db: Session = Depends(get_db)):
    """Delete a branch"""
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db.delete(db_branch)
    db.commit()
    return {"message": "Branch deleted successfully"}
