from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models, schemas
from database import get_db
from dependencies import get_admin_branch_filter, require_super_admin
import uuid
import os
import json
from pathlib import Path
from utils import s3_utils

router = APIRouter(
    prefix="/branches",
    tags=["branches"]
)

from dependencies import get_admin_branch_filter, require_super_admin, PermissionChecker

@router.get("", response_model=List[schemas.Branch])
@router.get("/", response_model=List[schemas.Branch])
def get_all_branches(
    city_id: str = None, 
    area_id: str = None, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker(["Manage Branch", "Reports and analytics"], "view")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Get all branches, optionally filtered by city_id or area_id and admin access"""
    query = db.query(models.Branch).options(joinedload(models.Branch.game_types))
    
    # 1. Apply Security Filter
    if branch_filter is not None:
        query = query.filter(models.Branch.id.in_(branch_filter))

    if city_id:
        query = query.filter(models.Branch.city_id == city_id)
    if area_id:
        query = query.filter(models.Branch.area_id == area_id)
    return query.all()

@router.get("/{branch_id}", response_model=schemas.Branch, dependencies=[Depends(PermissionChecker("Manage Branch", "view"))])
def get_branch(
    branch_id: str, 
    db: Session = Depends(get_db),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Get a specific branch by ID"""
    # Security check
    if branch_filter is not None and branch_id not in branch_filter:
         raise HTTPException(status_code=403, detail="Access denied to this branch")

    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("", response_model=schemas.Branch, dependencies=[Depends(PermissionChecker("Manage Branch", "add"))])
@router.post("/", response_model=schemas.Branch, dependencies=[Depends(PermissionChecker("Manage Branch", "add"))])
async def create_branch(
    name: str = Form(...),
    city_id: str = Form(...),
    area_id: str = Form(...),
    search_location: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    ground_overview: Optional[str] = Form(None),
    terms_condition: Optional[str] = Form(None),
    rule: Optional[str] = Form(None),
    google_map_url: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    max_players: Optional[int] = Form(None),
    phone_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
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
            if image.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(image, folder="branches")
                    image_urls.append(url)
                except Exception as e:
                    print(f"Error uploading image: {e}")
                    pass

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
        terms_condition=terms_condition,
        rule=rule,
        google_map_url=google_map_url,
        price=price,
        max_players=max_players,
        phone_number=phone_number,
        email=email,
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


@router.put("/{branch_id}", response_model=schemas.Branch, dependencies=[Depends(require_super_admin)])
async def update_branch(
    branch_id: str,
    name: str = Form(...),
    city_id: str = Form(...),
    area_id: str = Form(...),
    search_location: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    ground_overview: Optional[str] = Form(None),
    terms_condition: Optional[str] = Form(None),
    rule: Optional[str] = Form(None),
    google_map_url: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    max_players: Optional[int] = Form(None),
    phone_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
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
    # (Local deletion logic removed as we are now using S3. Future TODO: Implement S3 deletion)
    if db_branch.images:
        pass

    # Add new uploaded images
    if images:
        for image in images:
            if image.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(image, folder="branches")
                    image_urls.append(url)
                except Exception as e:
                    print(f"Error uploading image: {e}")
                    pass

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
    db_branch.terms_condition = terms_condition
    db_branch.rule = rule
    db_branch.google_map_url = google_map_url
    db_branch.price = price
    db_branch.max_players = max_players
    db_branch.phone_number = phone_number
    db_branch.email = email
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
@router.patch("/{branch_id}/toggle", response_model=schemas.Branch, dependencies=[Depends(require_super_admin)])
def toggle_branch_status(branch_id: str, db: Session = Depends(get_db)):
    """Toggle branch active status"""
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db_branch.is_active = not db_branch.is_active
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/{branch_id}", dependencies=[Depends(PermissionChecker("Manage Branch", "delete"))])
def delete_branch(branch_id: str, db: Session = Depends(get_db)):
    """Delete a branch"""
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db.delete(db_branch)
    db.commit()
    return {"message": "Branch deleted successfully"}
