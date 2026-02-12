from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models, schemas
from database import get_db
from dependencies import get_admin_branch_filter, PermissionChecker
import uuid
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"]
)
@router.post("", response_model=schemas.AdminBooking)
@router.post("/", response_model=schemas.AdminBooking)
def create_booking(
    booking: schemas.BookingCreate, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Bookings", "add")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Create a new user booking with optional coupon"""
    
    # Check if court exists
    court = db.query(models.Court).filter(models.Court.id == booking.court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")

    # Security Check: Ensure admin has access to this court's branch
    if branch_filter is not None:
        if str(court.branch_id) not in branch_filter:
            raise HTTPException(status_code=403, detail="Access denied to this branch")

    # Helper to parse time string
    def parse_time_str(t_str):
        if not t_str: return None
        for fmt in ('%H:%M', '%H:%M:%S', '%I:%M %p'):
            try:
                return datetime.strptime(t_str, fmt).time()
            except ValueError:
                continue
        return None

    # Parse times
    start_time_obj = parse_time_str(booking.start_time)
    end_time_obj = parse_time_str(booking.end_time)

    if not start_time_obj:
        raise HTTPException(status_code=400, detail="Invalid start_time format")

    # Calculate duration if not provided or just sanity check
    # But usually trust the provided duration_minutes or calc from end_time
    duration_minutes = booking.duration_minutes
    if end_time_obj:
        start_dt = datetime.combine(date.today(), start_time_obj)
        end_dt = datetime.combine(date.today(), end_time_obj)
        calc_duration = (end_dt - start_dt).seconds / 60
        if calc_duration < 0:
             calc_duration += 24 * 60
        # Optional: override duration_minutes with calculated one?
        # Let's fallback to calculated if provided is 0
        if duration_minutes == 0:
            duration_minutes = int(calc_duration)
    
    # Coupon Validation
    db_coupon = None
    discount_amount = Decimal(0)

    if booking.coupon_code:
        db_coupon = db.query(models.Coupon).filter(models.Coupon.code == booking.coupon_code).first()
        if not db_coupon:
             raise HTTPException(status_code=400, detail="Invalid coupon code")
        
        if not db_coupon.is_active:
             raise HTTPException(status_code=400, detail="Coupon is inactive")
        
        now = datetime.utcnow()
        if db_coupon.start_date > now or db_coupon.end_date < now:
             raise HTTPException(status_code=400, detail="Coupon is expired or not yet valid")
        
        if db_coupon.usage_limit and db_coupon.usage_count >= db_coupon.usage_limit:
             raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        
        # Specific User Validation
        if db_coupon.applicable_type == 'specific_user':
            if not booking.user_id:
                raise HTTPException(status_code=400, detail="User login required for this coupon")
            
            if booking.user_id not in (db_coupon.applicable_ids or []):
                raise HTTPException(status_code=400, detail="Coupon not valid for this user")

        # Per User Limit Validation
        if booking.user_id and db_coupon.per_user_limit:
            user_usage = db.query(models.Booking).filter(
                models.Booking.coupon_id == db_coupon.id,
                models.Booking.user_id == booking.user_id
            ).count()
            
            if user_usage >= db_coupon.per_user_limit:
                raise HTTPException(status_code=400, detail="Coupon usage limit reached for this user")

        # Calculate discount
        if db_coupon.discount_type == 'percentage':
            # Note: BookingCreate doesn't have total_amount. It has price_per_hour.
            # Model needs total_amount.
            pass # TODO: Fix discount calc if needed
        else: # flat
            discount_amount = db_coupon.discount_value
        
        # Increment usage
        db_coupon.usage_count += 1
        db.add(db_coupon)

    # Note: BookingCreate doesn't have total_amount. It has price_per_hour.
    # Model needs total_amount.
    # We should calculate total_amount = (duration_minutes/60) * price_per_hour
    if booking.total_amount is not None:
         total_amount = Decimal(booking.total_amount)
    else:
         total_amount = Decimal(duration_minutes / 60) * Decimal(booking.price_per_hour)
    
    original_amount = booking.original_amount or total_amount

    try:
        db_booking = models.Booking(
            **booking.dict(exclude={'coupon_code', 'start_time', 'end_time', 'total_amount', 'duration_minutes', 'original_amount'}),
            start_time=start_time_obj,
            end_time=end_time_obj,
            duration_minutes=duration_minutes,
            total_duration_minutes=duration_minutes, # Populate new field
            total_amount=total_amount, # Set calculated total
            original_amount=original_amount,
            # Populate old deprecated columns (NOT NULL constraints)
            _old_start_time=start_time_obj,
            _old_end_time=end_time_obj,
            _old_duration_minutes=duration_minutes,
            _old_price_per_hour=booking.price_per_hour,
            payment_id=str(uuid.uuid4()), # Placeholder
            coupon_id=db_coupon.id if db_coupon else None,
            coupon_discount=discount_amount
        )
        
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        
        # Reload with relationships for response
        return get_booking(str(db_booking.id), db)
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")

from dependencies import get_admin_branch_filter

@router.get("", response_model=List[schemas.AdminBooking])
@router.get("/", response_model=List[schemas.AdminBooking])
def get_all_bookings(
    court_id: Optional[str] = None,
    game_type_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker(["Manage Bookings", "Reports and analytics", "Transactions And Earnings"], "view")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Get all user bookings from 'booking' table with optional filters and related court/user data"""
    # Base query - removed broken court relationship options
    try:
        query = db.query(models.Booking).options(
            joinedload(models.Booking.user),  # Load user data
            joinedload(models.Booking.coupon)
        )

        # Determine effective branch filter (Security + User Request)
        effective_branches = None # None means ALL (Super Admin only)

        if branch_filter is not None:
            # Branch Admin restricted
            if branch_id:
                if branch_id not in branch_filter:
                    return []
                effective_branches = [branch_id]
            else:
                effective_branches = branch_filter
        else:
            # Super Admin
            if branch_id:
                effective_branches = [branch_id]

        # Apply spatial filters (Branch/GameType -> Court IDs)
        if effective_branches is not None or game_type_id:
            court_q = db.query(models.Court.id)
            
            if effective_branches:
                court_q = court_q.filter(models.Court.branch_id.in_(effective_branches))
            
            if game_type_id:
                court_q = court_q.filter(models.Court.game_type_id == game_type_id)
            
            # Get matching court IDs
            matching_court_ids = [c[0] for c in court_q.all()]
            if not matching_court_ids:
                return []
            
            query = query.filter(models.Booking.court_id.in_(matching_court_ids))

        if court_id:
            query = query.filter(models.Booking.court_id == court_id)
        if status:
            query = query.filter(models.Booking.status == status)
        if payment_status:
            query = query.filter(models.Booking.payment_status == payment_status)

        bookings = query.order_by(models.Booking.booking_date.desc(), models.Booking.start_time.desc()).all()

        # Manual Hydration: Fetch and attach Court objects
        if bookings:
            court_ids = {b.court_id for b in bookings if b.court_id}
            if court_ids:
                courts = db.query(models.Court).options(
                    joinedload(models.Court.branch).joinedload(models.Branch.city),
                    joinedload(models.Court.game_type)
                ).filter(models.Court.id.in_(court_ids)).all()
                
                court_map = {c.id: c for c in courts}
                
                for b in bookings:
                    if b.court_id in court_map:
                        b.court = court_map[b.court_id]

        # Convert Booking model to AdminBooking schema for frontend compatibility
        result = []
        for booking in bookings:
            # Calculate duration_hours from duration_minutes
            duration_hours = Decimal(booking.duration_minutes or 0) / Decimal(60)

            # Generate booking reference from ID
            booking_reference = f"BOOK{str(booking.id)[:8].upper()}"

            # Get user data from the user relationship
            customer_name = "Guest User"
            customer_email = "user@example.com"
            customer_phone = "+91xxxxxxxxxx"

            if booking.user:
                # Prefer first_name + last_name, fallback to full_name, then team_name, then phone
                name_parts = []
                if booking.user.first_name:
                    name_parts.append(booking.user.first_name)
                if booking.user.last_name:
                    name_parts.append(booking.user.last_name)
                
                full_name_constructed = " ".join(name_parts).strip()

                if full_name_constructed:
                    customer_name = full_name_constructed
                elif booking.user.full_name and booking.user.full_name.strip():
                    customer_name = booking.user.full_name.strip()
                elif booking.team_name and booking.team_name.strip():
                    customer_name = booking.team_name.strip()
                elif booking.user.phone_number:
                    customer_name = booking.user.phone_number # Fallback to phone if no name

                # Get email and phone from user
                customer_email = booking.user.email or customer_email
                customer_phone = booking.user.phone_number or customer_phone
            
            # Safely access court data (it might be manually attached or None)
            # Note: booking.court is now available via manual hydration
            court_data = getattr(booking, 'court', None)

            # Create AdminBooking response
            # Create AdminBooking response
            admin_booking = schemas.AdminBooking(
                id=str(booking.id),
                user_id=str(booking.user_id) if booking.user_id else None,
                number_of_players=booking.number_of_players,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                court_id=str(booking.court_id),
                game_type_id=str(court_data.game_type_id) if court_data else None,
                booking_reference=booking_reference,
                booking_date=booking.booking_date,
                start_time=booking.start_time,
                end_time=booking.end_time,
                # Updated fields
                time_slots=booking.time_slots or [],
                total_duration_minutes=booking.total_duration_minutes or int(booking.duration_minutes or 0),
                
                total_amount=booking.total_amount,
                original_amount=booking.original_amount or booking.total_amount, # Fallback
                discount_amount=booking.discount_amount or 0,
                
                special_requests=booking.special_requests or "",
                status=booking.status,
                payment_status=booking.payment_status,
                created_at=booking.created_at,
                updated_at=booking.updated_at,
                court=court_data,  # Include court data with branch and city
                game_type=court_data.game_type if court_data else None,  # Include game type data
                coupon_code=booking.coupon.code if booking.coupon else None,
                coupon_discount=booking.coupon_discount or 0
            )
            result.append(admin_booking)

        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{booking_id}", response_model=schemas.AdminBooking, dependencies=[Depends(PermissionChecker("Manage Bookings", "view"))])
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    """Get a specific user booking by ID from 'booking' table with court/user data"""
    # Base query manual hydration
    booking = db.query(models.Booking).options(
        joinedload(models.Booking.user),  # Load user data
        joinedload(models.Booking.coupon)
    ).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Manually fetch court data
    if booking.court_id:
         court = db.query(models.Court).options(
             joinedload(models.Court.branch).joinedload(models.Branch.city),
             joinedload(models.Court.game_type)
         ).filter(models.Court.id == booking.court_id).first()
         booking.court = court
    else:
         booking.court = None

    # Calculate duration_hours from duration_minutes
    duration_hours = Decimal(booking.duration_minutes) / Decimal(60)

    # Generate booking reference from ID
    booking_reference = f"BOOK{str(booking.id)[:8].upper()}"

    # Get user data from the user relationship
    customer_name = "Guest User"
    customer_email = "user@example.com"
    customer_phone = "+91xxxxxxxxxx"

    if booking.user:
        # Prefer first_name + last_name, fallback to full_name, then team_name, then phone
        name_parts = []
        if booking.user.first_name:
            name_parts.append(booking.user.first_name)
        if booking.user.last_name:
            name_parts.append(booking.user.last_name)
        
        full_name_constructed = " ".join(name_parts).strip()

        if full_name_constructed:
            customer_name = full_name_constructed
        elif booking.user.full_name and booking.user.full_name.strip():
            customer_name = booking.user.full_name.strip()
        elif booking.team_name and booking.team_name.strip():
            customer_name = booking.team_name.strip()
        elif booking.user.phone_number:
            customer_name = booking.user.phone_number # Fallback to phone if no name

        # Get email and phone from user
        customer_email = booking.user.email or customer_email
        customer_phone = booking.user.phone_number or customer_phone

    # Safely access court data
    court_data = getattr(booking, 'court', None)

    # Create AdminBooking response
    return schemas.AdminBooking(
        id=str(booking.id),
        user_id=str(booking.user_id) if booking.user_id else None,
        number_of_players=booking.number_of_players,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        court_id=str(booking.court_id),
        game_type_id=str(court_data.game_type_id) if court_data else None,
        booking_reference=booking_reference,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        time_slots=booking.time_slots or [],
        total_duration_minutes=booking.total_duration_minutes or int(booking.duration_minutes or 0),
        total_amount=booking.total_amount,
        original_amount=booking.original_amount or booking.total_amount,
        discount_amount=booking.discount_amount or 0,
        special_requests=booking.special_requests or "",
        status=booking.status,
        payment_status=booking.payment_status,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        court=court_data,
        game_type=court_data.game_type if court_data else None,
        coupon_code=booking.coupon.code if booking.coupon else None,
        coupon_discount=booking.coupon_discount or 0
    )

@router.put("/{booking_id}", response_model=schemas.AdminBooking)
def update_booking(
    booking_id: str, 
    booking_update: schemas.BookingCreate, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker(["Manage Bookings", "Transactions And Earnings"], "edit")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Update an existing booking"""
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Security: Check existence access (find court -> branch)
    # We need to fetch court of the booking to check access
    existing_court = db.query(models.Court).filter(models.Court.id == db_booking.court_id).first()
    if existing_court and branch_filter is not None:
         if str(existing_court.branch_id) not in branch_filter:
             raise HTTPException(status_code=403, detail="Access denied to this booking's branch")

    # Security: If changing court, check new court access
    if booking_update.court_id and booking_update.court_id != str(db_booking.court_id):
         new_court = db.query(models.Court).filter(models.Court.id == booking_update.court_id).first()
         if not new_court:
             raise HTTPException(status_code=404, detail="New court not found")
         if branch_filter is not None:
             if str(new_court.branch_id) not in branch_filter:
                 raise HTTPException(status_code=403, detail="Access denied to new court's branch")

    # Helper to parse time string
    def parse_time_str(t_str):
        if not t_str: return None
        for fmt in ('%H:%M', '%H:%M:%S', '%I:%M %p'):
            try:
                return datetime.strptime(t_str, fmt).time()
            except ValueError:
                continue
        return None

    # Parse times
    start_time_obj = parse_time_str(booking_update.start_time)
    end_time_obj = parse_time_str(booking_update.end_time)

    if not start_time_obj:
        raise HTTPException(status_code=400, detail="Invalid start_time format")

    # Calculate duration
    duration_minutes = booking_update.duration_minutes
    if end_time_obj:
        start_dt = datetime.combine(date.today(), start_time_obj)
        end_dt = datetime.combine(date.today(), end_time_obj)
        calc_duration = (end_dt - start_dt).seconds / 60
        if calc_duration < 0:
             calc_duration += 24 * 60
        if duration_minutes == 0:
            duration_minutes = int(calc_duration)
    
    # Calculate total amount if not provided
    if booking_update.total_amount is not None:
         total_amount = Decimal(booking_update.total_amount)
    else:
         total_amount = Decimal(duration_minutes / 60) * Decimal(booking_update.price_per_hour)

    original_amount = booking_update.original_amount or total_amount

    # Update fields
    db_booking.user_id = booking_update.user_id
    db_booking.court_id = booking_update.court_id
    db_booking.booking_date = booking_update.booking_date
    db_booking.start_time = start_time_obj
    db_booking.end_time = end_time_obj
    db_booking.duration_minutes = duration_minutes
    db_booking.total_duration_minutes = duration_minutes
    db_booking.total_amount = total_amount
    db_booking.original_amount = original_amount
    db_booking.special_requests = booking_update.special_requests
    db_booking.time_slots = booking_update.time_slots
    db_booking.number_of_players = booking_update.number_of_players
    
    if booking_update.status:
        db_booking.status = booking_update.status
    if booking_update.payment_status:
        db_booking.payment_status = booking_update.payment_status
    
    # Deprecated/Legacy fields
    db_booking._old_start_time = start_time_obj
    db_booking._old_end_time = end_time_obj
    db_booking._old_duration_minutes = duration_minutes
    db_booking._old_price_per_hour = booking_update.price_per_hour

    try:
        db.commit()
        db.refresh(db_booking)
        return get_booking(str(db_booking.id), db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update booking: {str(e)}")

@router.patch("/{booking_id}/status", dependencies=[Depends(PermissionChecker(["Manage Bookings", "Transactions And Earnings"], "edit"))])
def update_booking_status(booking_id: str, request: dict, db: Session = Depends(get_db)):
    """Update user booking status in 'booking' table"""
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    status = request.get('status')
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    db_booking.status = status
    db.commit()
    db.refresh(db_booking)
    return {"message": f"Booking status updated to {status}"}

@router.patch("/{booking_id}/payment-status", dependencies=[Depends(PermissionChecker(["Manage Bookings", "Transactions And Earnings"], "edit"))])
def update_payment_status(booking_id: str, payment_status: str, db: Session = Depends(get_db)):
    """Update user booking payment status in 'booking' table - for admin validation"""
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db_booking.payment_status = payment_status
    db.commit()
    db.refresh(db_booking)
    return {"message": f"Payment status updated to {payment_status}"}

@router.delete("/{booking_id}")
def delete_booking(
    booking_id: str, 
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Manage Bookings", "delete")),
    branch_filter: Optional[List[str]] = Depends(get_admin_branch_filter)
):
    """Delete a booking"""
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Security Check
    if branch_filter is not None:
        court = db.query(models.Court).filter(models.Court.id == db_booking.court_id).first()
        if court and str(court.branch_id) not in branch_filter:
            raise HTTPException(status_code=403, detail="Access denied to this booking's branch")

    db.delete(db_booking)
    db.commit()
    return {"message": "Booking deleted successfully"}
