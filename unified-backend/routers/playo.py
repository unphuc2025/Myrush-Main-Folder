"""
Playo Integration API Router
Provides endpoints for Playo platform to integrate with MyRush venues
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, time as dt_time, date
from uuid import UUID
from decimal import Decimal
import schemas, models, database
from dependencies import verify_playo_token

router = APIRouter(
    prefix="/playo",
    tags=["Playo Integration"],
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_court_availability_slots(
    db: Session,
    court_id: UUID,
    booking_date: date
) -> List[dict]:
    """Get available time slots for a court on a specific date"""
    
    # Get court details
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        return []
    
    # Get existing bookings for this court on this date
    bookings = db.query(models.Booking).filter(
        models.Booking.court_id == court_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status.in_(['confirmed', 'pending'])
    ).all()
    
    # Get pending Playo orders
    pending_orders = db.query(models.PlayoOrder).filter(
        models.PlayoOrder.court_id == court_id,
        models.PlayoOrder.booking_date == booking_date,
        models.PlayoOrder.status == 'pending',
        models.PlayoOrder.expires_at > datetime.utcnow()
    ).all()
    
    # Generate hourly slots (6 AM to 11 PM)
    slots = []
    for hour in range(6, 23):
        start = dt_time(hour, 0)
        end = dt_time(hour + 1, 0)
        
        # Check if slot is available
        is_available = True
        
        # Check against bookings
        for booking in bookings:
            if booking.time_slots:
                for slot in booking.time_slots:
                    try:
                        slot_start = datetime.strptime(slot['start'], '%H:%M:%S').time()
                        slot_end = datetime.strptime(slot['end'], '%H:%M:%S').time()
                        if not (end <= slot_start or start >= slot_end):
                            is_available = False
                            break
                    except:
                        pass
        
        # Check against pending orders
        for order in pending_orders:
            if not (end <= order.start_time or start >= order.end_time):
                is_available = False
                break
        
        slots.append({
            'startTime': start.strftime('%H:%M:%S'),
            'endTime': end.strftime('%H:%M:%S'),
            'available': is_available,
            'price': float(court.price_per_hour) if is_available else None
        })
    
    return slots

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/availability", response_model=schemas.PlayoAvailabilityResponse)
async def fetch_availability(
    venue_id: str = Query(..., alias="venueId"),
    sport_id: str = Query(..., alias="sportId"),
    date: str = Query(...),  # YYYY-MM-DD
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Fetch available time slots for courts at a venue
    
    Query Parameters:
    - venueId: Branch/Venue UUID
    - sportId: Game Type UUID
    - date: Booking date in YYYY-MM-DD format
    
    Returns:
    - List of courts with their available time slots
    """
    
    try:
        # Parse date
        booking_date = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Get all courts for this venue and sport
        courts = db.query(models.Court).join(models.GameType).filter(
            models.Court.branch_id == UUID(venue_id),
            models.GameType.id == UUID(sport_id),
            models.Court.is_active == True
        ).all()
        
        court_availability = []
        for court in courts:
            slots = get_court_availability_slots(
                db=db,
                court_id=court.id,
                booking_date=booking_date
            )
            
            court_availability.append(schemas.PlayoCourt(
                courtId=str(court.id),
                courtName=court.name,
                slots=[schemas.PlayoSlot(**slot) for slot in slots]
            ))
        
        return schemas.PlayoAvailabilityResponse(courts=court_availability)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders", response_model=schemas.PlayoOrderCreateResponse)
async def create_order(
    request: schemas.PlayoOrderCreateRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Create temporary order reservations (block slots before payment)
    
    Request Body:
    - venueId: Branch/Venue UUID
    - orders: List of order items with court, date, time, and price
    
    Returns:
    - List of created order IDs mapping external to Playo IDs
    """
    
    try:
        created_orders = []
        
        for item in request.orders:
            # Parse data
            court_id = UUID(item.courtId)
            booking_date = datetime.strptime(item.date, '%Y-%m-%d').date()
            start_time = datetime.strptime(item.startTime, '%H:%M:%S').time()
            end_time = datetime.strptime(item.endTime, '%H:%M:%S').time()
            
            # Verify slot is still available
            slots = get_court_availability_slots(db, court_id, booking_date)
            slot_available = False
            for slot in slots:
                slot_start = datetime.strptime(slot['startTime'], '%H:%M:%S').time()
                slot_end = datetime.strptime(slot['endTime'], '%H:%M:%S').time()
                if slot_start == start_time and slot_end == end_time and slot['available']:
                    slot_available = True
                    break
            
            if not slot_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Slot {item.startTime}-{item.endTime} is not available for court {item.courtId}"
                )
            
            # Create order
            order = models.PlayoOrder(
                playo_order_id=item.playoOrderId,
                venue_id=UUID(request.venueId),
                court_id=court_id,
                booking_date=booking_date,
                start_time=start_time,
                end_time=end_time,
                price=item.price,
                status='pending',
                expires_at=datetime.utcnow() + timedelta(minutes=15)  # 15 min expiry
            )
            
            db.add(order)
            db.flush()
            
            created_orders.append({
                'externalOrderId': str(order.id),
                'playoOrderId': item.playoOrderId
            })
        
        db.commit()
        
        return schemas.PlayoOrderCreateResponse(
            orderIds=[schemas.PlayoOrderIdMapping(**oid) for oid in created_orders],
            requestStatus=1,
            message="Orders created successfully"
        )
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        return schemas.PlayoOrderCreateResponse(
            orderIds=[],
            requestStatus=0,
            message=str(e)
        )


@router.post("/orders/confirm", response_model=schemas.PlayoOrderConfirmResponse)
async def confirm_order(
    request: schemas.PlayoOrderConfirmRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Confirm orders and create bookings (after payment success)
    
    Request Body:
    - orderIds: List of external order IDs to confirm
    
    Returns:
    - List of created booking IDs
    """
    
    try:
        confirmed_bookings = []
        
        # Create a system user for Playo bookings if doesn't exist
        playo_user = db.query(models.User).filter(
            models.User.phone_number == "PLAYO_SYSTEM"
        ).first()
        
        if not playo_user:
            playo_user = models.User(
                phone_number="PLAYO_SYSTEM",
                full_name="Playo System User",
                email="playo@myrush.in",
                is_verified=True,
                is_active=True,
                profile_completed=True
            )
            db.add(playo_user)
            db.flush()
        
        for order_id in request.orderIds:
            order = db.query(models.PlayoOrder).filter(
                models.PlayoOrder.id == UUID(order_id),
                models.PlayoOrder.status == 'pending'
            ).first()
            
            if not order:
                continue
            
            # Create booking
            booking = models.Booking(
                user_id=playo_user.id,
                court_id=order.court_id,
                booking_date=order.booking_date,
                time_slots=[{
                    'start': order.start_time.strftime('%H:%M:%S'),
                    'end': order.end_time.strftime('%H:%M:%S'),
                    'price': float(order.price)
                }],
                total_duration_minutes=60,  # Assuming 1 hour slots
                original_amount=order.price,
                total_amount=order.price,
                discount_amount=0,
                status='confirmed',
                payment_status='paid',
                booking_source='playo',
                playo_order_id=order.playo_order_id
            )
            
            db.add(booking)
            db.flush()
            
            # Update order
            order.status = 'confirmed'
            order.booking_id = booking.id
            
            confirmed_bookings.append({
                'externalBookingId': str(booking.id),
                'playoOrderId': order.playo_order_id
            })
        
        db.commit()
        
        return schemas.PlayoOrderConfirmResponse(
            bookingIds=[schemas.PlayoBookingIdMapping(**bid) for bid in confirmed_bookings],
            requestStatus=1,
            message="Orders confirmed successfully"
        )
        
    except Exception as e:
        db.rollback()
        return schemas.PlayoOrderConfirmResponse(
            bookingIds=[],
            requestStatus=0,
            message=str(e)
        )


@router.post("/orders/cancel", response_model=schemas.PlayoOrderCancelResponse)
async def cancel_order(
    request: schemas.PlayoOrderCancelRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Cancel pending orders (release reserved slots)
    
    Request Body:
    - orderIds: List of external order IDs to cancel
    
    Returns:
    - Success/failure status
    """
    
    try:
        for order_id in request.orderIds:
            order = db.query(models.PlayoOrder).filter(
                models.PlayoOrder.id == UUID(order_id)
            ).first()
            
            if order:
                order.status = 'cancelled'
        
        db.commit()
        
        return schemas.PlayoOrderCancelResponse(
            requestStatus=1,
            message="Orders cancelled successfully"
        )
        
    except Exception as e:
        db.rollback()
        return schemas.PlayoOrderCancelResponse(
            requestStatus=0,
            message=str(e)
        )


@router.post("/bookings/cancel", response_model=schemas.PlayoBookingCancelResponse)
async def cancel_booking(
    request: schemas.PlayoBookingCancelRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Cancel confirmed bookings
    
    Request Body:
    - bookingIds: List of booking items to cancel with refund info
    
    Returns:
    - Success/failure status
    """
    
    try:
        for item in request.bookingIds:
            booking = db.query(models.Booking).filter(
                models.Booking.id == UUID(item.externalBookingId)
            ).first()
            
            if booking:
                booking.status = 'cancelled'
                # Note: Refund handling would be done by Playo if refundAtPlayo is True
        
        db.commit()
        
        return schemas.PlayoBookingCancelResponse(
            requestStatus=1,
            message="Bookings cancelled successfully"
        )
        
    except Exception as e:
        db.rollback()
        return schemas.PlayoBookingCancelResponse(
            requestStatus=0,
            message=str(e)
        )


@router.post("/bookings/map", response_model=schemas.PlayoBookingMapResponse)
async def map_bookings(
    request: schemas.PlayoBookingMapRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(verify_playo_token)
):
    """
    Map Playo booking IDs to external booking IDs (optional endpoint)
    
    Request Body:
    - bookingIds: List of booking ID mappings
    
    Returns:
    - Success/failure status
    """
    
    try:
        for item in request.bookingIds:
            booking = db.query(models.Booking).filter(
                models.Booking.id == UUID(item.externalBookingId)
            ).first()
            
            if booking:
                booking.playo_booking_id = item.playoBookingId
        
        db.commit()
        
        return schemas.PlayoBookingMapResponse(
            requestStatus=1,
            message="Bookings mapped successfully"
        )
        
    except Exception as e:
        db.rollback()
        return schemas.PlayoBookingMapResponse(
            requestStatus=0,
            message=str(e)
        )
