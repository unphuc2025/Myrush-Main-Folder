from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"]
)
@router.post("", response_model=schemas.AdminBooking)
@router.post("/", response_model=schemas.AdminBooking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    """Create a new user booking with optional coupon"""
    
    # Check if court exists
    court = db.query(models.Court).filter(models.Court.id == booking.court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")

    # Calculate duration
    start_dt = datetime.combine(date.today(), booking.start_time)
    end_dt = datetime.combine(date.today(), booking.end_time)
    duration_minutes = (end_dt - start_dt).seconds / 60
    if duration_minutes < 0: # Handle overnight
         duration_minutes += 24 * 60
    
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
            discount = (booking.total_amount * db_coupon.discount_value) / 100
            if db_coupon.max_discount:
                discount = min(discount, db_coupon.max_discount)
            discount_amount = discount
        else: # flat
            discount_amount = db_coupon.discount_value
        
        # Ensure discount doesn't exceed total
        discount_amount = min(discount_amount, booking.total_amount)
        
        # Increment usage
        db_coupon.usage_count += 1
        db.add(db_coupon)

    db_booking = models.Booking(
        **booking.dict(exclude={'coupon_code'}),
        duration_minutes=duration_minutes,
        payment_id=str(uuid.uuid4()), # Placeholder
        coupon_id=db_coupon.id if db_coupon else None,
        coupon_discount=discount_amount
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Reload with relationships for response
    return get_booking(str(db_booking.id), db)

@router.get("", response_model=List[schemas.AdminBooking])
@router.get("/", response_model=List[schemas.AdminBooking])
def get_all_bookings(
    court_id: Optional[str] = None,
    game_type_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all user bookings from 'booking' table with optional filters and related court/user data"""
    # Base query - removed broken court relationship options
    query = db.query(models.Booking).options(
        joinedload(models.Booking.user),  # Load user data
        joinedload(models.Booking.coupon)
    )

    # Handle Court-related filters manually first
    if branch_id or game_type_id:
        court_q = db.query(models.Court.id)
        if branch_id:
            court_q = court_q.filter(models.Court.branch_id == branch_id)
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
        duration_hours = Decimal(booking.duration_minutes) / Decimal(60)

        # Generate booking reference from ID
        booking_reference = f"BOOK{str(booking.id)[:8].upper()}"

        # Get user data from the user relationship
        customer_name = "Guest User"
        customer_email = "user@example.com"
        customer_phone = "+91xxxxxxxxxx"

        if booking.user:
            # Prefer first_name + last_name, fallback to full_name, then team_name
            if booking.user.first_name:
                customer_name = f"{booking.user.first_name} {booking.user.last_name or ''}".strip()
            elif booking.user.full_name:
                customer_name = booking.user.full_name
            elif booking.team_name:
                customer_name = booking.team_name

            # Get email and phone from user
            customer_email = booking.user.email or customer_email
            customer_phone = booking.user.phone_number or customer_phone
        
        # Safely access court data (it might be manually attached or None)
        # Note: booking.court is now available via manual hydration
        court_data = getattr(booking, 'court', None)

        # Create AdminBooking response
        admin_booking = schemas.AdminBooking(
            id=str(booking.id),
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            court_id=str(booking.court_id),
            game_type_id=str(court_data.game_type_id) if court_data else None,
            booking_reference=booking_reference,
            booking_date=booking.booking_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            duration_hours=duration_hours,
            total_amount=booking.total_amount,
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

@router.get("/{booking_id}", response_model=schemas.AdminBooking)
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
        # Prefer first_name + last_name, fallback to full_name, then team_name
        if booking.user.first_name:
            customer_name = f"{booking.user.first_name} {booking.user.last_name or ''}".strip()
        elif booking.user.full_name:
            customer_name = booking.user.full_name
        elif booking.team_name:
            customer_name = booking.team_name

        # Get email and phone from user
        customer_email = booking.user.email or customer_email
        customer_phone = booking.user.phone_number or customer_phone

    # Safely access court data
    court_data = getattr(booking, 'court', None)

    # Create AdminBooking response
    return schemas.AdminBooking(
        id=str(booking.id),
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        court_id=str(booking.court_id),
        game_type_id=str(court_data.game_type_id) if court_data else None,
        booking_reference=booking_reference,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        duration_hours=duration_hours,
        total_amount=booking.total_amount,
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

@router.patch("/{booking_id}/status")
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

@router.patch("/{booking_id}/payment-status")
def update_payment_status(booking_id: str, payment_status: str, db: Session = Depends(get_db)):
    """Update user booking payment status in 'booking' table - for admin validation"""
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db_booking.payment_status = payment_status
    db.commit()
    db.refresh(db_booking)
    return {"message": f"Payment status updated to {payment_status}"}
