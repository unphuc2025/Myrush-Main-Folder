"""
Playo Integration API Router
Provides endpoints for Playo platform to integrate with MyRush venues
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, time as dt_time, date
from uuid import UUID, uuid4
from decimal import Decimal
import schemas, models, database, dependencies, crud
from date_utils import parse_date_safe, parse_time_safe
import logging

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
    """Get available time slots (30-min granularity) for a court on a specific date"""
    from utils.booking_utils import get_booked_slots, generate_allowed_slots_map
    
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
    
    booked_slots = get_booked_slots(bookings)
    
    # Get pending Playo orders (excluding expired)
    pending_orders = db.query(models.PlayoOrder).filter(
        models.PlayoOrder.court_id == court_id,
        models.PlayoOrder.booking_date == booking_date,
        models.PlayoOrder.status == 'pending',
        models.PlayoOrder.expires_at > datetime.utcnow()
    ).all()
    
    for order in pending_orders:
        s_f = order.start_time.hour + (order.start_time.minute / 60.0)
        e_f = order.end_time.hour + (order.end_time.minute / 60.0)
        if e_f == 0: e_f = 24.0
        curr = s_f
        while curr < e_f:
            booked_slots.add(curr % 24)
            curr += 0.5
            
    # Get allowed slots from configuration
    allowed_map = generate_allowed_slots_map(db, court.id, booking_date)
    
    slots = []
    # Generate 30-min slots (6 AM to 11 PM)
    import numpy as np
    for slot_f in np.arange(6.0, 23.0, 0.5):
        h = int(slot_f); m = int((slot_f % 1)*60)
        start = dt_time(h, m)
        
        eh = int(slot_f + 0.5); em = int(((slot_f + 0.5) % 1)*60)
        end = dt_time(eh % 24, em)
        
        time_key = f"{h:02d}:{m:02d}"
        is_available = False
        price = None
        
        if time_key in allowed_map and slot_f not in booked_slots:
            is_available = True
            price = float(allowed_map[time_key]['price'])
            
        slots.append({
            'startTime': start.strftime('%H:%M:%S'),
            'endTime': end.strftime('%H:%M:%S'),
            'available': is_available,
            'price': price,
            'ticketsAvailable': 1 if is_available else 0
        })
    
    return slots

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_or_create_playo_user(
    db: Session,
    name: str,
    mobile: str,
    email: str
) -> models.User:
    """
    Get user by phone number or create a new one.
    This ensures Playo bookings are linked to real user accounts.
    """
    if not mobile:
        # Fallback to system user if no mobile provided
        mobile = "PLAYO_SYSTEM"
        name = "Playo System User"
        email = "playo@myrush.in"

    user = db.query(models.User).filter(models.User.phone_number == mobile).first()
    
    if not user:
        # Create new user
        try:
             # Use a dummy password hash from crud or hardcoded
             hashed_pw = crud.get_password_hash("playo_user_temp")
        except:
             hashed_pw = "dummy_hash"

        user = models.User(
            phone_number=mobile,
            full_name=name,
            first_name=name.split(' ')[0] if name else "Playo",
            last_name=' '.join(name.split(' ')[1:]) if name and ' ' in name else "User",
            email=email if email else f"{mobile}@playo.temp", 
            password_hash=hashed_pw,
            is_verified=True, # Trusted via Playo
            is_active=True,
            profile_completed=False,
            country_code='+91' # Default
        )
        db.add(user)
        db.flush()
        
    return user
# ============================================================================

@router.get("/availability", response_model=schemas.PlayoAvailabilityResponse)
async def fetch_availability(
    venue_id: str = Query(..., alias="venueId"),
    sport_id: str = Query(..., alias="sportId"),
    date: str = Query(...),  # YYYY-MM-DD
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_token)
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
        # Parse date safely
        booking_date = parse_date_safe(date, '%Y-%m-%d', 'date')
        
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

            # Include all courts with all their slots (both available and unavailable)
            court_availability.append(schemas.PlayoCourt(
                courtId=str(court.id),
                courtName=court.name,
                slots=[schemas.PlayoSlot(**slot) for slot in slots]
            ))
        
        # Return response with proper structure
        return schemas.PlayoAvailabilityResponse(
            courts=court_availability,
            requestStatus=1,
            message="Success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders", response_model=schemas.PlayoOrderCreateResponse)
async def create_order(
    request: schemas.PlayoOrderCreateRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_api_key)
):
    """
    Create temporary order reservations (block slots before payment)

    Request Body:
    - venueId: Branch/Venue UUID
    - userName: User's name
    - userMobile: User's mobile number
    - userEmail: User's email
    - orders: List of order items with court, date, time, price, and Playo payment info

    Returns:
    - List of created order IDs mapping external to Playo IDs
    - Playo-compatible response format
    """
    logging.info(f"Playo order request received: {request.dict()}")

    try:
        # Validate venueId is a valid UUID
        try:
            venue_id = UUID(request.venueId)
        except ValueError:
            logging.warning(f"Invalid venueId format: {request.venueId}")
            return schemas.PlayoOrderCreateResponse(
                orderIds=[],
                requestStatus=0,
                message="Invalid venueId format"
            )

        # Validate all orders first (transactional approach)
        validated_orders = []
        validation_errors = []

        for item in request.orders:
            try:
                # Validate courtId is a valid UUID
                court_id = UUID(item.courtId)

                # Validate date format (YYYY-MM-DD)
                try:
                    booking_date = datetime.strptime(item.date, '%Y-%m-%d').date()
                except ValueError:
                    validation_errors.append(f"Invalid date format for order {item.playoOrderId}")
                    continue

                # Validate time formats (HH:MM:SS)
                try:
                    start_time = datetime.strptime(item.startTime, '%H:%M:%S').time()
                    end_time = datetime.strptime(item.endTime, '%H:%M:%S').time()
                except ValueError:
                    validation_errors.append(f"Invalid time format for order {item.playoOrderId}")
                    continue

                # Validate price and paidAtPlayo are positive numbers
                if item.price <= 0 or item.paidAtPlayo < 0:
                    validation_errors.append(f"Invalid price values for order {item.playoOrderId}")
                    continue

                # Verify venue exists
                venue = db.query(models.Branch).filter(models.Branch.id == venue_id).first()
                if not venue:
                    validation_errors.append(f"Venue {request.venueId} not found")
                    continue

                # Verify court exists and belongs to venue
                court = db.query(models.Court).filter(
                    models.Court.id == court_id,
                    models.Court.branch_id == venue_id
                ).first()
                if not court:
                    validation_errors.append(f"Court {item.courtId} not found or doesn't belong to venue")
                    continue

                # Verify slot is still available (block can span multiple 30-min slots)
                slots = get_court_availability_slots(db, court_id, booking_date)
                
                req_start_f = start_time.hour + (start_time.minute / 60.0)
                req_end_f = end_time.hour + (end_time.minute / 60.0)
                if req_end_f == 0: req_end_f = 24.0
                
                # Check every 30-min interval in the requested block
                available_slots_map = {
                    datetime.strptime(s['startTime'], '%H:%M:%S').time().hour + 
                    datetime.strptime(s['startTime'], '%H:%M:%S').time().minute / 60.0: s['available']
                    for s in slots
                }
                
                slot_available = True
                curr = req_start_f
                while curr < req_end_f:
                    if curr not in available_slots_map or not available_slots_map[curr]:
                        slot_available = False
                        break
                    curr += 0.5

                if not slot_available:
                    validation_errors.append(f"Slot {item.startTime}-{item.endTime} is not available for court {item.courtId}")
                    continue

                # If all validations pass, add to validated orders
                validated_orders.append({
                    'court_id': court_id,
                    'booking_date': booking_date,
                    'start_time': start_time,
                    'end_time': end_time,
                    'price': item.price,
                    'paidAtPlayo': item.paidAtPlayo,
                    'playoOrderId': item.playoOrderId
                })

            except Exception as e:
                validation_errors.append(f"Validation error for order {item.playoOrderId}: {str(e)}")
                continue

        # If any validation errors, return failure (Playo rule: all or nothing)
        if validation_errors:
            logging.warning(f"Playo order validation failed: {validation_errors}")
            return schemas.PlayoOrderCreateResponse(
                orderIds=[],
                requestStatus=0,
                message=validation_errors[0] if validation_errors else "Order creation failed"
            )

        # Enforce 1-hour minimum booking (aggregate per court/date)
        durations_per_entity = {} # (court_id, booking_date) -> total_minutes
        for order in validated_orders:
            key = (order['court_id'], order['booking_date'])
            s_f = order['start_time'].hour + (order['start_time'].minute / 60.0)
            e_f = order['end_time'].hour + (order['end_time'].minute / 60.0)
            if e_f == 0: e_f = 24.0
            duration = int((e_f - s_f) * 60)
            if duration < 0: duration += 24 * 60
            durations_per_entity[key] = durations_per_entity.get(key, 0) + duration
        
        for key, total_mins in durations_per_entity.items():
            if total_mins < 60:
                logging.warning(f"Playo order failed 1-hour minimum: {key} had only {total_mins} mins")
                return schemas.PlayoOrderCreateResponse(
                    orderIds=[],
                    requestStatus=0,
                    message="Minimum booking duration is 1 hour (60 minutes)."
                )

        # All orders validated successfully, now create them
        created_orders = []

        for order_data in validated_orders:
            # Create order
            order = models.PlayoOrder(
                playo_order_id=order_data['playoOrderId'],
                venue_id=venue_id,
                court_id=order_data['court_id'],
                booking_date=order_data['booking_date'],
                start_time=order_data['start_time'],
                end_time=order_data['end_time'],
                price=order_data['price'],
                status='pending',
                expires_at=datetime.utcnow() + timedelta(minutes=15),  # 15 min expiry
                # Store user details
                user_name=request.userName,
                user_mobile=request.userMobile,
                user_email=request.userEmail
            )

            db.add(order)
            db.flush()

            created_orders.append({
                'externalOrderId': str(order.id),
                'playoOrderId': order_data['playoOrderId']
            })

        db.commit()
        logging.info(f"Playo orders created successfully: {created_orders}")
        return schemas.PlayoOrderCreateResponse(
            orderIds=[schemas.PlayoOrderIdMapping(**oid) for oid in created_orders],
            requestStatus=1,
            message="Success"
        )

    except HTTPException as he:
        db.rollback()
        logging.error(f"HTTPException in Playo order creation: {he.detail}", exc_info=True)
        # Convert HTTP exceptions to Playo-compatible format
        # DEBUG
        return schemas.PlayoOrderCreateResponse(
            orderIds=[],
            requestStatus=0,
            message=f"HTTP Error: {he.detail}"
        )
    except Exception as e:
        db.rollback()
        logging.error(f"Exception in Playo order creation: {e}", exc_info=True)
        # Never expose internal errors - return Playo-compatible response
        # DEBUG: returning error
        return schemas.PlayoOrderCreateResponse(
            orderIds=[],
            requestStatus=0,
            message=f"Error: {str(e)}"
        )


@router.post("/orders/confirm", response_model=schemas.PlayoOrderConfirmResponse)
async def confirm_order(
    request: schemas.PlayoOrderConfirmRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_token)
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
        
        for order_id in request.orderIds:
            order = db.query(models.PlayoOrder).filter(
                models.PlayoOrder.id == UUID(order_id),
                models.PlayoOrder.status == 'pending'
            ).first()
            
            if not order:
                continue
            
            # Get or create actual user from order details
            real_user = get_or_create_playo_user(
                db, 
                order.user_name, 
                order.user_mobile, 
                order.user_email
            )
            
            # Calculate duration correctly
            s_f = order.start_time.hour + (order.start_time.minute / 60.0)
            e_f = order.end_time.hour + (order.end_time.minute / 60.0)
            if e_f == 0: e_f = 24.0
            duration_mins = int((e_f - s_f) * 60)
            if duration_mins < 0: duration_mins += 24 * 60

            booking = models.Booking(
                user_id=real_user.id,
                court_id=order.court_id,
                booking_date=order.booking_date,
                time_slots=[{
                    'start': order.start_time.strftime('%H:%M:%S'),
                    'end': order.end_time.strftime('%H:%M:%S'),
                    'price': float(order.price)
                }],
                total_duration_minutes=duration_mins,
                original_amount=order.price,
                total_amount=order.price,
                discount_amount=0,
                status='confirmed',
                payment_status='paid',
                booking_source='playo',
                playo_order_id=order.playo_order_id,
                # Set deprecated fields to avoid database constraint violations
                _old_start_time=order.start_time,
                _old_end_time=order.end_time,
                _old_duration_minutes=duration_mins,
                _old_price_per_hour=float(order.price) / (duration_mins/60.0) if duration_mins > 0 else 0
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
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_token)
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
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_token)
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
                logging.info(f"Booking {item.externalBookingId} cancelled via Playo. Refund amount: {item.refundAtPlayo}")
        
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
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_token)
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


@router.post("/booking/create", response_model=schemas.PlayoBookingCreateResponse)
async def create_booking(
    request: schemas.PlayoBookingCreateRequest,
    db: Session = Depends(database.get_db),
    api_key: models.PlayoAPIKey = Depends(dependencies.verify_playo_api_key)
):
    """
    Create and confirm bookings for the slots selected by the customer
    
    Request Body:
    - venueId: Branch/Venue UUID
    - userName: Name of the booking customer
    - userMobile: Default value to identify Playo bookings
    - userEmail: Default value to identify Playo bookings
    - bookings: List of booking items with court, date, time, price, and Playo order info
    
    Returns:
    - List of created booking IDs mapping external to Playo IDs
    - Playo-compatible response format
    """
    
    try:
        # Validate venueId is a valid UUID
        try:
            venue_id = UUID(request.venueId)
        except ValueError:
            logging.warning(f"Invalid venueId format: {request.venueId}")
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Invalid venueId format"
            )

        # Validate all bookings first (transactional approach)
        validated_bookings = []
        validation_errors = []

        for item in request.bookings:
            try:
                # Validate courtId is a valid UUID
                court_id = UUID(item.courtId)

                # Validate date format (YYYY-MM-DD)
                try:
                    booking_date = datetime.strptime(item.date, '%Y-%m-%d').date()
                except ValueError:
                    validation_errors.append(f"Invalid date format for booking {item.playoOrderId}")
                    continue

                # Validate time formats (HH:MM:SS)
                try:
                    start_time = datetime.strptime(item.startTime, '%H:%M:%S').time()
                    end_time = datetime.strptime(item.endTime, '%H:%M:%S').time()
                except ValueError:
                    validation_errors.append(f"Invalid time format for booking {item.playoOrderId}")
                    continue

                # Validate price and paidAtPlayo are positive numbers
                if item.price <= 0 or item.paidAtPlayo < 0:
                    validation_errors.append(f"Invalid price values for booking {item.playoOrderId}")
                    continue

                # Verify venue exists
                venue = db.query(models.Branch).filter(models.Branch.id == venue_id).first()
                if not venue:
                    validation_errors.append(f"Venue {request.venueId} not found")
                    continue

                # Verify court exists and belongs to venue
                court = db.query(models.Court).filter(
                    models.Court.id == court_id,
                    models.Court.branch_id == venue_id
                ).first()
                if not court:
                    validation_errors.append(f"Court {item.courtId} not found or doesn't belong to venue")
                    continue

                # Verify slot is still available (block can span multiple 30-min slots)
                slots = get_court_availability_slots(db, court_id, booking_date)
                
                req_start_f = start_time.hour + (start_time.minute / 60.0)
                req_end_f = end_time.hour + (end_time.minute / 60.0)
                if req_end_f == 0: req_end_f = 24.0
                
                # Check every 30-min interval in the requested block
                available_slots_map = {
                    datetime.strptime(s['startTime'], '%H:%M:%S').time().hour + 
                    datetime.strptime(s['startTime'], '%H:%M:%S').time().minute / 60.0: s['available']
                    for s in slots
                }
                
                slot_available = True
                curr = req_start_f
                while curr < req_end_f:
                    if curr not in available_slots_map or not available_slots_map[curr]:
                        slot_available = False
                        break
                    curr += 0.5

                if not slot_available:
                    validation_errors.append(f"Slot {item.startTime}-{item.endTime} is not available for court {item.courtId}")
                    continue

                # If all validations pass, add to validated bookings
                validated_bookings.append({
                    'court_id': court_id,
                    'booking_date': booking_date,
                    'start_time': start_time,
                    'end_time': end_time,
                    'price': item.price,
                    'paidAtPlayo': item.paidAtPlayo,
                    'playoOrderId': item.playoOrderId,
                    'numTickets': item.numTickets
                })

            except Exception as e:
                validation_errors.append(f"Validation error for booking {item.playoOrderId}: {str(e)}")
                continue

        # If any validation errors, return failure (Playo rule: all or nothing)
        if validation_errors:
            logging.warning(f"Playo booking validation failed: {validation_errors}")
            # Return the first validation error message for better debugging
            first_error = validation_errors[0] if validation_errors else "Booking creation failed"
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message=first_error
            )

        # Enforce 1-hour minimum booking (aggregate per court/date)
        durations_per_entity = {} # (court_id, booking_date) -> total_minutes
        for b in validated_bookings:
            key = (b['court_id'], b['booking_date'])
            s_f = b['start_time'].hour + (b['start_time'].minute / 60.0)
            e_f = b['end_time'].hour + (b['end_time'].minute / 60.0)
            if e_f == 0: e_f = 24.0
            duration = int((e_f - s_f) * 60)
            if duration < 0: duration += 24 * 60
            durations_per_entity[key] = durations_per_entity.get(key, 0) + duration

        for key, total_mins in durations_per_entity.items():
            if total_mins < 60:
                logging.warning(f"Playo booking failed 1-hour minimum: {key} had only {total_mins} mins")
                return schemas.PlayoBookingCreateResponse(
                    bookingIds=[],
                    requestStatus=0,
                    message="Minimum booking duration is 1 hour (60 minutes)."
                )

        # All bookings validated successfully, now create them
        created_bookings = []

        # Get or create actual user from request details (once for all items usually same user)
        real_user = get_or_create_playo_user(
            db, 
            request.userName, 
            request.userMobile, 
            request.userEmail
        )

        for booking_data in validated_bookings:
            # Calculate duration correctly
            s_f = booking_data['start_time'].hour + (booking_data['start_time'].minute / 60.0)
            e_f = booking_data['end_time'].hour + (booking_data['end_time'].minute / 60.0)
            if e_f == 0: e_f = 24.0
            duration_mins = int((e_f - s_f) * 60)
            if duration_mins < 0: duration_mins += 24 * 60

            # Create booking
            booking = models.Booking(
                user_id=real_user.id,
                court_id=booking_data['court_id'],
                booking_date=booking_data['booking_date'],
                time_slots=[{
                    'start': booking_data['start_time'].strftime('%H:%M:%S'),
                    'end': booking_data['end_time'].strftime('%H:%M:%S'),
                    'price': float(booking_data['price']),
                    'numTickets': booking_data['numTickets']  # For ticketing (swimming)
                }],
                total_duration_minutes=duration_mins,
                original_amount=booking_data['price'],
                total_amount=booking_data['price'],
                discount_amount=0,
                status='confirmed',
                payment_status='paid',
                booking_source='playo',
                playo_order_id=booking_data['playoOrderId'],
                # Set deprecated fields to avoid database constraint violations
                _old_start_time=booking_data['start_time'],
                _old_end_time=booking_data['end_time'],
                _old_duration_minutes=duration_mins,
                _old_price_per_hour=float(booking_data['price']) / (duration_mins/60.0) if duration_mins > 0 else 0
            )

            db.add(booking)
            db.flush()

            created_bookings.append({
                'externalBookingId': str(booking.id),
                'playoOrderId': booking_data['playoOrderId']
            })

        db.commit()
        logging.info(f"Playo bookings created successfully: {created_bookings}")
        return schemas.PlayoBookingCreateResponse(
            bookingIds=[schemas.PlayoBookingIdMapping(**bid) for bid in created_bookings],
            requestStatus=1,
            message="Success"
        )

    except HTTPException as he:
        db.rollback()
        logging.error(f"HTTPException in Playo booking creation: {he.detail}", exc_info=True)
        # Convert HTTP exceptions to Playo-compatible format
        # DEBUG
        return schemas.PlayoBookingCreateResponse(
            bookingIds=[],
            requestStatus=0,
            message=f"HTTP Error: {he.detail}"
        )
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logging.error(f"Exception in Playo booking creation: {error_msg}", exc_info=True)
        
        # Provide more specific error messages for debugging
        if "Invalid venueId format" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Invalid venueId format"
            )
        elif "Venue" in error_msg and "not found" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Venue not found"
            )
        elif "Court" in error_msg and "not found" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Court not found or doesn't belong to venue"
            )
        elif "Slot" in error_msg and "not available" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Slot not available"
            )
        elif "Invalid date format" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Invalid date format"
            )
        elif "Invalid time format" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Invalid time format"
            )
        elif "Invalid price values" in error_msg:
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Invalid price values"
            )
        else:
            # Generic error for unknown issues
            return schemas.PlayoBookingCreateResponse(
                bookingIds=[],
                requestStatus=0,
                message="Booking creation failed"
            )
