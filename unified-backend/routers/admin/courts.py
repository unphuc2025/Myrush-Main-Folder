from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from decimal import Decimal, InvalidOperation
import models, schemas
from database import get_db
from dependencies import get_admin_branch_filter, PermissionChecker
import uuid
import os
import shutil
import json
from pathlib import Path
from utils import s3_utils
from services.integrations.orchestrator import IntegrationOrchestrator

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

@router.get("", response_model=schemas.CourtListResponse)
@router.get("/", response_model=schemas.CourtListResponse)
def get_all_courts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    branch_id: str = None, 
    city_id: Optional[str] = None,
    game_type_id: str = None, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "view")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Get all courts with pagination and searching, filtered by branch access rights and city"""
    query = db.query(models.Court)
    
    # Apply city filter if provided
    if city_id:
        query = query.join(models.Branch).filter(models.Branch.city_id == city_id)
    
    # 1. Apply Role-Based Restrictions (Server-side)
    if branch_filter is not None:
        if branch_id:
            if branch_id not in branch_filter:
                return {"items": [], "total": 0, "page": 1, "pages": 0}
            query = query.filter(models.Court.branch_id == branch_id)
        else:
            query = query.filter(models.Court.branch_id.in_(branch_filter))
    else:
        if branch_id:
            query = query.filter(models.Court.branch_id == branch_id)

    # 2. Search
    if search:
        query = query.filter(models.Court.name.ilike(f"%{search}%"))

    # 3. Apply other filters
    if game_type_id:
        query = query.filter(models.Court.game_type_id == game_type_id)
        
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": current_page,
        "pages": pages
    }

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
    logic_type: str = Form('independent'),
    facility_type_id: Optional[str] = Form(None),
    shared_group_id: Optional[str] = Form(None),
    capacity_limit: int = Form(1),
    total_zones: int = Form(1),
    sport_slices: Optional[str] = Form(None),
    price_overrides: Optional[str] = Form(None),
    rental_item_ids: Optional[str] = Form(None),
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

    # Validate price_per_hour
    try:
        if not price_per_hour or price_per_hour.strip() == "":
             raise HTTPException(status_code=400, detail="Base price per hour is required")
        price_val = Decimal(price_per_hour)
    except (ValueError, InvalidOperation):
        raise HTTPException(status_code=400, detail="Invalid price total. Please enter a valid number.")

    # Create court
    db_court = models.Court(
        name=name,
        branch_id=branch_id,
        game_type_id=game_type_id,
        price_per_hour=price_val,
        price_conditions=price_conditions_data,
        unavailability_slots=unavailability_slots_data,
        terms_and_conditions=terms_and_conditions,
        amenities=amenities_data,
        images=image_urls if image_urls else None,
        videos=video_urls if video_urls else None,
        is_active=is_active,
        logic_type=logic_type,
        facility_type_id=facility_type_id if facility_type_id and facility_type_id != "null" else None,
        shared_group_id=shared_group_id if shared_group_id and shared_group_id != "null" else None,
        capacity_limit=capacity_limit,
        total_zones=total_zones,
        price_overrides=json.loads(price_overrides) if price_overrides else None
    )
    db.add(db_court)
    db.flush()
    
    # Add CourtZones based on total_zones
    if logic_type == 'divisible' or total_zones > 1:
        for i in range(total_zones):
            db.add(models.CourtZone(
                court_id=db_court.id, 
                zone_index=i, 
                zone_name=f"Zone {i+1}"
            ))

    # Add SportSlices
    if sport_slices:
        try:
            slices_data = json.loads(sport_slices)
            for sl in slices_data:
                # Validate slice price
                slice_price = sl.get("price_per_hour")
                if not slice_price or str(slice_price).strip() == "":
                    raise HTTPException(status_code=400, detail=f"Price is required for slice '{sl.get('name')}'")
                
                db.add(models.SportSlice(
                    court_id=db_court.id,
                    sport_id=sl.get("sport_id", game_type_id),
                    name=sl.get("name"),
                    mask=sl.get("mask"),
                    price_per_hour=Decimal(slice_price)
                ))
        except Exception as e:
            print(f"Error parsing sport slices: {e}")

    db.commit()
    db.refresh(db_court)
    
    # Associate Rental Items
    if rental_item_ids:
        try:
            ids = json.loads(rental_item_ids)
            if ids:
                items = db.query(models.RentalItem).filter(models.RentalItem.id.in_(ids)).all()
                db_court.rental_items = items
                db.commit()
        except: pass
    try:
        IntegrationOrchestrator.notify_court_schedule_change(db, str(db_court.id), "update")
    except Exception as e:
        print(f"Bulk schedule notification failed: {e}")

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
    logic_type: Optional[str] = Form(None),
    facility_type_id: Optional[str] = Form(None),
    shared_group_id: Optional[str] = Form(None),
    capacity_limit: Optional[int] = Form(None),
    total_zones: Optional[int] = Form(None),
    sport_slices: Optional[str] = Form(None),
    price_overrides: Optional[str] = Form(None),
    rental_item_ids: Optional[str] = Form(None),
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
    
    # Validate and update price_per_hour
    try:
        if not price_per_hour or price_per_hour.strip() == "":
             raise HTTPException(status_code=400, detail="Base price per hour is required")
        db_court.price_per_hour = Decimal(price_per_hour)
    except (ValueError, InvalidOperation):
        raise HTTPException(status_code=400, detail="Invalid price per hour. Please enter a valid number.")

    db_court.price_conditions = price_conditions_data
    db_court.unavailability_slots = unavailability_slots_data
    db_court.terms_and_conditions = terms_and_conditions
    if amenities_data is not None:
        db_court.amenities = amenities_data
    db_court.images = image_urls if image_urls else None
    db_court.videos = video_urls if video_urls else None
    db_court.is_active = is_active
    
    if logic_type is not None: db_court.logic_type = logic_type
    if facility_type_id is not None: db_court.facility_type_id = facility_type_id if facility_type_id != "null" else None
    if shared_group_id is not None: db_court.shared_group_id = shared_group_id if shared_group_id != "null" else None
    if capacity_limit is not None: db_court.capacity_limit = capacity_limit
    if total_zones is not None: db_court.total_zones = total_zones
    if price_overrides is not None: 
        try: db_court.price_overrides = json.loads(price_overrides)
        except: pass

    # Update SportSlices and zones if provided
    if sport_slices is not None:
        try:
            # Clear existing slices and recreate
            db.query(models.SportSlice).filter(models.SportSlice.court_id == db_court.id).delete()
            
            slices_data = json.loads(sport_slices)
            for sl in slices_data:
                # Validate slice price
                slice_price = sl.get("price_per_hour")
                if not slice_price or str(slice_price).strip() == "":
                    raise HTTPException(status_code=400, detail=f"Price is required for slice '{sl.get('name')}'")

                db.add(models.SportSlice(
                    court_id=db_court.id,
                    sport_id=sl.get("sport_id", game_type_id),
                    name=sl.get("name"),
                    mask=sl.get("mask"),
                    price_per_hour=Decimal(slice_price)
                ))
        except Exception as e:
            print(f"Error parsing sport slices: {e}")
            
    if total_zones is not None:
        # Clear existing zones and recreate
        db.query(models.CourtZone).filter(models.CourtZone.court_id == db_court.id).delete()
        if (logic_type == 'divisible' if logic_type is not None else db_court.logic_type == 'divisible') or total_zones > 1:
            for i in range(total_zones):
                db.add(models.CourtZone(
                    court_id=db_court.id, 
                    zone_index=i, 
                    zone_name=f"Zone {i+1}"
                ))

    # Update Rental Items
    if rental_item_ids is not None:
        try:
            ids = json.loads(rental_item_ids)
            items = db.query(models.RentalItem).filter(models.RentalItem.id.in_(ids)).all()
            db_court.rental_items = items
        except: pass

    db.commit()
    db.refresh(db_court)
    
    # Notify partners about recurring schedule changes (Bulk)
    try:
        IntegrationOrchestrator.notify_court_schedule_change(db, str(db_court.id), "update")
    except Exception as e:
        print(f"Bulk schedule notification failed: {e}")

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
    
    # Notify partners about recurring schedule (available/block toggle) - Bulk
    try:
        status_action = "available" if db_court.is_active else "block"
        IntegrationOrchestrator.notify_court_schedule_change(db, str(db_court.id), status_action)
    except Exception as e:
        print(f"Toggle notification failed: {e}")

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
    # Check for associations that would block deletion or cause integrity issues
    booking_count = db.query(models.Booking).filter(models.Booking.court_id == court_id).count()
    if booking_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete court '{db_court.name}' because it has {booking_count} associated booking(s). Please delete the bookings first or deactivate the court."
        )

    playo_order_count = db.query(models.PlayoOrder).filter(models.PlayoOrder.court_id == court_id).count()
    if playo_order_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete court '{db_court.name}' because it has {playo_order_count} associated Playo order(s). Please resolve these orders first or deactivate the court."
        )

    tournament_count = db.query(models.Tournament).filter(models.Tournament.court_id == str(court_id)).count()
    if tournament_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete court '{db_court.name}' because it is associated with {tournament_count} tournament(s). Please update the tournaments first or deactivate the court."
        )

    try:
        db.delete(db_court)
        db.commit()
        return {"message": f"Court '{db_court.name}' deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        # Fallback for other constraints not caught above
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Constraint violation: Could not delete court. It might still be referenced by other records. (Error: {error_msg})"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/bulk-update-slots")
async def bulk_update_slots(
    date: Optional[str] = Form(None), # Backward compatibility
    dates: Optional[str] = Form(None), # NEW: JSON array of dates
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    price: str = Form(...),
    original_slot_from: Optional[str] = Form(None),
    original_slot_to: Optional[str] = Form(None),
    branch_id: Optional[str] = Form(None),
    game_type_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
) -> dict:
    """Bulk update slots for all courts (or filtered by branch/game_type) for multiple dates"""
    try:
        # Parse the dates
        date_list = []
        if dates:
            try:
                date_list = json.loads(dates)
                if not isinstance(date_list, list):
                    date_list = [str(dates)]
            except:
                date_list = [str(dates)]
        elif date:
            date_list = [date]
        else:
            raise HTTPException(status_code=400, detail="Date or Dates is required")

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

        # Determine what to filter out: either the new time OR the original time if provided
        from_to_match = (original_slot_from, original_slot_to) if (original_slot_from and original_slot_to) else (slot_from, slot_to)

        for court in courts:
            # Get existing price conditions
            price_conditions = court.price_conditions or []
            if isinstance(price_conditions, str):
                try:
                    price_conditions = json.loads(price_conditions)
                except:
                    price_conditions = []

            for date_key in date_list:
                # Filter OUT any existing date-specific slot for this EXACT date and the TARGET time (original or new)
                price_conditions = [
                    pc for pc in price_conditions 
                    if not (pc.get('dates') and date_key in pc.get('dates', []) and pc.get('slotFrom') == from_to_match[0] and pc.get('slotTo') == from_to_match[1])
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
            "dates": date_list,
            "slot_from": slot_from,
            "slot_to": slot_to,
            "price": price
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in bulk_update_slots: {e}")
        raise HTTPException(status_code=400, detail=f"Error updating slots: {str(e)}")

@router.post("/bulk-delete-slots")
async def bulk_delete_slots(
    date: Optional[str] = Form(None),
    dates: Optional[str] = Form(None),
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    branch_id: Optional[str] = Form(None),
    game_type_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Bulk delete slots for multiple courts and dates"""
    try:
        # Parse the dates
        date_list = []
        if dates:
            try:
                date_list = json.loads(dates)
                if not isinstance(date_list, list): date_list = [str(dates)]
            except: date_list = [str(dates)]
        elif date: date_list = [date]
        else: raise HTTPException(status_code=400, detail="Date or Dates is required")

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

            original_len = len(price_conditions)
            
            for date_key in date_list:
                # Filter OUT matching slots
                price_conditions = [
                    pc for pc in price_conditions 
                    if not (pc.get('dates') and date_key in pc.get('dates', []) and pc.get('slotFrom') == slot_from and pc.get('slotTo') == slot_to)
                ]

            if len(price_conditions) != original_len:
                court.price_conditions = price_conditions
                flag_modified(court, "price_conditions")
                deleted_count += 1

        db.commit()
        return {"message": f"Successfully deleted slots from {deleted_count} courts", "deleted_count": deleted_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error deleting slots: {str(e)}")

@router.post("/bulk-block-slots")
async def bulk_block_slots(
    dates: str = Form(...), # JSON array [ "2024-12-01", ... ]
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    is_blocked: str = Form("true"), # Use string as Form often receives it this way
    branch_id: Optional[str] = Form(None),
    game_type_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Courts", "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Bulk block or unblock slots across multiple courts and dates"""
    try:
        # Parse dates
        try:
            date_list = json.loads(dates)
            if not isinstance(date_list, list): date_list = [str(dates)]
        except: date_list = [str(dates)]

        block_status = is_blocked.lower() == "true"
            
        # Get all courts (optionally filtered)
        query = db.query(models.Court).filter(models.Court.is_active == True)
        
        # Security & Filtering
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
        updated_count = 0
        
        for court in courts:
            unavailability = court.unavailability_slots or []
            if isinstance(unavailability, str):
                try: unavailability = json.loads(unavailability)
                except: unavailability = []
                
            updated_unavailability = list(unavailability)
            
            for date_key in date_list:
                if block_status:
                    # Add block
                    exists = any(
                        un.get('dates') and date_key in un.get('dates', []) and 
                        un.get('times') and slot_from in un.get('times', [])
                        for un in updated_unavailability
                    )
                    if not exists:
                        updated_unavailability.append({
                            'type': 'date',
                            'dates': [date_key],
                            'times': [slot_from]
                        })
                else:
                    # Remove block
                    updated_unavailability = [
                        un for un in updated_unavailability
                        if not (un.get('dates') and date_key in un.get('dates', []) and 
                                un.get('times') and slot_from in un.get('times', []))
                    ]
            
            court.unavailability_slots = updated_unavailability
            flag_modified(court, "unavailability_slots")
            updated_count += 1
            
        db.commit()
        return {"message": f"Successfully updated block status for {updated_count} courts", "updated_count": updated_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error bulk blocking slots: {str(e)}")