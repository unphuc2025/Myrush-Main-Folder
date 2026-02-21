from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from decimal import Decimal
import models, schemas
from database import get_db
from dependencies import get_admin_branch_filter, PermissionChecker
import uuid
import os
import shutil
import json
from pathlib import Path
from utils import s3_utils

# Create uploads directory if it doesn't exist
# (Local upload logic removed in favor of S3)
# UPLOAD_DIR_IMAGES = Path("uploads/courts/images")
# UPLOAD_DIR_VIDEOS = Path("uploads/courts/videos")
# UPLOAD_DIR_IMAGES.mkdir(parents=True, exist_ok=True)
# UPLOAD_DIR_VIDEOS.mkdir(parents=True, exist_ok=True)

router = APIRouter(
    prefix="/courts",
    tags=["courts"]
)

from dependencies import get_admin_branch_filter

@router.get("", response_model=List[schemas.Court])
@router.get("/", response_model=List[schemas.Court])
def get_all_courts(
    branch_id: str = None, 
    game_type_id: str = None, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "view")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Get all courts, filtered by branch access rights"""
    query = db.query(models.Court)
    
    # 1. Apply Role-Based Restrictions (Server-side)
    if branch_filter is not None:
        # User is restricted to specific branches
        if branch_id:
            # If requesting a specific branch, ensure it's in their allowed list
            if branch_id not in branch_filter:
                return []
            query = query.filter(models.Court.branch_id == branch_id)
        else:
            # Return courts from ALL allowed branches
            query = query.filter(models.Court.branch_id.in_(branch_filter))
    else:
        # SUPER ADMIN (No filter)
        if branch_id:
            query = query.filter(models.Court.branch_id == branch_id)

    # 2. Apply other filters
    if game_type_id:
        query = query.filter(models.Court.game_type_id == game_type_id)
        
    return query.all()

@router.get("/{court_id}", response_model=schemas.Court, dependencies=[Depends(PermissionChecker("Manage Courts", "view"))])
def get_court(court_id: str, db: Session = Depends(get_db)):
    """Get a specific court by ID"""
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    return court

@router.post("", response_model=schemas.Court)
@router.post("/", response_model=schemas.Court)
async def create_court(
    name: str = Form(...),
    branch_id: str = Form(...),
    game_type_id: str = Form(...),
    price_per_hour: str = Form(...),
    price_conditions: Optional[str] = Form(None),
    unavailability_slots: Optional[str] = Form(None),
    terms_and_conditions: Optional[str] = Form(None),
    amenities: Optional[str] = Form(None),
    is_active: bool = Form(True),
    images: Optional[List[UploadFile]] = File(None),
    videos: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "add")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Create a new court with file uploads"""
    
    # Security Check
    if branch_filter is not None:
         if branch_id not in branch_filter:
             raise HTTPException(status_code=403, detail="Access denied to this branch")
    # Handle image uploads
    image_urls = []
    if images:
        for image in images:
            if image.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(image, folder="courts/images")
                    image_urls.append(url)
                except Exception as e:
                    print(f"Error uploading image: {e}")
                    pass

    # Handle video uploads
    video_urls = []
    if videos:
        for video in videos:
            if video.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(video, folder="courts/videos")
                    video_urls.append(url)
                except Exception as e:
                    print(f"Error uploading video: {e}")
                    pass

    # Parse price conditions if provided
    price_conditions_data = None
    if price_conditions:
        try:
            price_conditions_data = json.loads(price_conditions)
        except json.JSONDecodeError:
            price_conditions_data = None

    # Add default 5AM-11AM slots ONLY if explicitely requested or if essential logic requires it. 
    # Current user feedback suggests they want full control to delete slots, so we remove the forced default logic.
    if price_conditions_data is None:
        price_conditions_data = []

    # Apply global price conditions
    try:
        global_conditions = db.query(models.GlobalPriceCondition).filter(
            models.GlobalPriceCondition.is_active == True
        ).all()
        
        for global_condition in global_conditions:
            # Check if global condition already exists in price_conditions
            condition_exists = False
            for pc in price_conditions_data:
                if (pc.get('days') == global_condition.days and 
                    pc.get('slotFrom') == global_condition.slot_from and 
                    pc.get('slotTo') == global_condition.slot_to):
                    pc['price'] = str(global_condition.price)
                    condition_exists = True
                    break
            
            if not condition_exists:
                price_conditions_data.append({
                    'id': f"global-{global_condition.id}",
                    'type': 'recurring',
                    'days': global_condition.days or [],
                    'slotFrom': global_condition.slot_from,
                    'slotTo': global_condition.slot_to,
                    'price': str(global_condition.price)
                })
    except:
        pass  # If GlobalPriceCondition table doesn't exist yet, skip

    # Parse unavailability slots if provided
    unavailability_slots_data = None
    if unavailability_slots:
        try:
            unavailability_slots_data = json.loads(unavailability_slots)
        except json.JSONDecodeError:
            unavailability_slots_data = None

    # Parse amenities if provided
    amenities_data = None
    if amenities:
        try:
            amenities_data = json.loads(amenities)
        except json.JSONDecodeError:
            amenities_data = []

    # Create court
    db_court = models.Court(
        name=name,
        branch_id=branch_id,
        game_type_id=game_type_id,
        price_per_hour=Decimal(price_per_hour),
        price_conditions=price_conditions_data,
        unavailability_slots=unavailability_slots_data,
        terms_and_conditions=terms_and_conditions,
        amenities=amenities_data,
        images=image_urls if image_urls else None,
        videos=video_urls if video_urls else None,
        is_active=is_active
    )
    db.add(db_court)
    db.commit()
    db.refresh(db_court)
    return db_court

@router.put("/{court_id}", response_model=schemas.Court)
async def update_court(
    court_id: str,
    name: str = Form(...),
    branch_id: str = Form(...),
    game_type_id: str = Form(...),
    price_per_hour: str = Form(...),
    price_conditions: Optional[str] = Form(None),
    unavailability_slots: Optional[str] = Form(None),
    terms_and_conditions: Optional[str] = Form(None),
    amenities: Optional[str] = Form(None),
    is_active: bool = Form(True),
    images: Optional[List[UploadFile]] = File(None),
    videos: Optional[List[UploadFile]] = File(None),
    existing_images: Optional[List[str]] = Form(None),
    existing_videos: Optional[List[str]] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Update a court with file uploads"""
    db_court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")

    # Security Check: Existing Court Access
    if branch_filter is not None:
         if str(db_court.branch_id) not in branch_filter:
             raise HTTPException(status_code=403, detail="Access denied to this court's branch")
         
         # Security Check: New Branch Access (if changing)
         if branch_id != str(db_court.branch_id):
             if branch_id not in branch_filter:
                 raise HTTPException(status_code=403, detail="Access denied to target branch")

    # Handle image uploads
    image_urls = existing_images if existing_images else []

    # Delete old images that are not in existing_images (S3 deletion logic omitted for now, just DB ref update)
    # Ideally should delete from S3, but for now we just stop referencing them.

    # Add new uploaded images
    if images:
        for image in images:
            if image.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(image, folder="courts/images")
                    image_urls.append(url)
                except Exception as e:
                    print(f"Error uploading image: {e}")
                    pass

    # Handle video uploads
    video_urls = existing_videos if existing_videos else []

    # Add new uploaded videos
    if videos:
        for video in videos:
            if video.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(video, folder="courts/videos")
                    video_urls.append(url)
                except Exception as e:
                    print(f"Error uploading video: {e}")
                    pass

    # Parse price conditions if provided
    price_conditions_data = None
    if price_conditions:
        try:
            price_conditions_data = json.loads(price_conditions)
        except json.JSONDecodeError:
            price_conditions_data = None

    # Parse unavailability slots if provided
    unavailability_slots_data = None
    if unavailability_slots:
        try:
            unavailability_slots_data = json.loads(unavailability_slots)
        except json.JSONDecodeError:
            unavailability_slots_data = None

    # Parse amenities if provided
    amenities_data = None
    if amenities:
        try:
            amenities_data = json.loads(amenities)
        except json.JSONDecodeError:
            amenities_data = []

    # Update court fields
    db_court.name = name
    db_court.branch_id = branch_id
    db_court.game_type_id = game_type_id
    db_court.price_per_hour = Decimal(price_per_hour)
    db_court.price_conditions = price_conditions_data
    db_court.unavailability_slots = unavailability_slots_data
    db_court.terms_and_conditions = terms_and_conditions
    if amenities_data is not None:
        db_court.amenities = amenities_data
    db_court.images = image_urls if image_urls else None
    db_court.videos = video_urls if video_urls else None
    db_court.is_active = is_active

    db.commit()
    db.refresh(db_court)
    return db_court

@router.patch("/{court_id}/toggle", response_model=schemas.Court, dependencies=[Depends(PermissionChecker("Manage Courts", "edit"))])
def toggle_court_status(
    court_id: str, 
    db: Session = Depends(get_db),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Toggle court active status"""
    db_court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    # Security Check
    if branch_filter is not None:
         if str(db_court.branch_id) not in branch_filter:
             raise HTTPException(status_code=403, detail="Access denied to this court's branch")
    
    db_court.is_active = not db_court.is_active
    db.commit()
    db.refresh(db_court)
    return db_court

@router.delete("/{court_id}", dependencies=[Depends(PermissionChecker("Manage Courts", "delete"))])
def delete_court(
    court_id: str, 
    db: Session = Depends(get_db),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Delete a court"""
    db_court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not db_court:
         raise HTTPException(status_code=404, detail="Court not found")

    # Security Check
    if branch_filter is not None:
         if str(db_court.branch_id) not in branch_filter:
             raise HTTPException(status_code=403, detail="Access denied to this court's branch")
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    db.delete(db_court)
    db.commit()
    return {"message": "Court deleted successfully"}

@router.post("/bulk-update-slots")
async def bulk_update_slots(
    date: str = Form(...),
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    price: str = Form(...),
    branch_id: Optional[str] = Form(None),
    game_type_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Bulk update slots for all courts (or filtered by branch/game_type) for a specific date"""
    try:
        # Parse the date
        from datetime import datetime
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        date_key = date

        # Get all courts (optionally filtered)
        query = db.query(models.Court).filter(models.Court.is_active == True)
        
        # Apply Security
        if branch_filter is not None:
             if branch_id:
                 if branch_id not in branch_filter:
                     raise HTTPException(status_code=403, detail="Access denied to this branch")
                 query = query.filter(models.Court.branch_id == branch_id)
             else:
                 query = query.filter(models.Court.branch_id.in_(branch_filter))
        else:
             if branch_id:
                 query = query.filter(models.Court.branch_id == branch_id)

        if game_type_id:
            query = query.filter(models.Court.game_type_id == game_type_id)
        
        courts = query.all()
        updated_count = 0

        for court in courts:
            # Get existing price conditions
            price_conditions = court.price_conditions or []
            if isinstance(price_conditions, str):
                try:
                    price_conditions = json.loads(price_conditions)
                except:
                    price_conditions = []

            # Filter OUT any existing date-specific slot for this EXACT date-time combo to prevent duplicates (Bug 3)
            price_conditions = [
                pc for pc in price_conditions 
                if not (pc.get('dates') and date_key in pc.get('dates', []) and pc.get('slotFrom') == slot_from and pc.get('slotTo') == slot_to)
            ]

            # Create new date-specific slot
            new_slot = {
                'id': f"{date_key}-{slot_from}-{slot_to}-{uuid.uuid4().hex[:6]}",
                'type': 'date',
                'dates': [date_key],
                'slotFrom': slot_from,
                'slotTo': slot_to,
                'price': price
            }
            price_conditions.append(new_slot)

            # Update court
            court.price_conditions = price_conditions
            flag_modified(court, "price_conditions") # Ensure retention
            updated_count += 1

        db.commit()
        return {
            "message": f"Successfully updated slots for {updated_count} courts",
            "updated_count": updated_count,
            "date": date_key,
            "slot_from": slot_from,
            "slot_to": slot_to,
            "price": price
        }
    except Exception as e:
        db.rollback()
        print(f"Error in bulk_update_slots: {e}")
        raise HTTPException(status_code=400, detail=f"Error updating slots: {str(e)}")

@router.post("/bulk-delete-slots")
async def bulk_delete_slots(
    date: str = Form(...),
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    branch_id: Optional[str] = Form(None),
    game_type_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Bulk delete slots for all courts (or filtered) for a specific date and time (Bug 4)"""
    try:
        # Get all courts (optionally filtered)
        query = db.query(models.Court).filter(models.Court.is_active == True)
        
        if branch_filter is not None:
            if branch_id:
                if branch_id not in branch_filter: raise HTTPException(status_code=403, detail="Access denied")
                query = query.filter(models.Court.branch_id == branch_id)
            else:
                query = query.filter(models.Court.branch_id.in_(branch_filter))
        elif branch_id:
            query = query.filter(models.Court.branch_id == branch_id)

        if game_type_id:
            query = query.filter(models.Court.game_type_id == game_type_id)
        
        courts = query.all()
        deleted_count = 0

        for court in courts:
            price_conditions = court.price_conditions or []
            if isinstance(price_conditions, str):
                try: price_conditions = json.loads(price_conditions)
                except: price_conditions = []

            # Filter OUT matching slots
            new_conditions = [
                pc for pc in price_conditions 
                if not (pc.get('dates') and date in pc.get('dates', []) and pc.get('slotFrom') == slot_from and pc.get('slotTo') == slot_to)
            ]

            if len(new_conditions) != len(price_conditions):
                court.price_conditions = new_conditions
                flag_modified(court, "price_conditions")
                deleted_count += 1

        db.commit()
        return {"message": f"Successfully deleted slots from {deleted_count} courts", "deleted_count": deleted_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error deleting slots: {str(e)}")