from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func, text
import models, schemas
from utils.coupon_utils import increment_coupon_usage
from passlib.context import CryptContext
import uuid
from datetime import timedelta, datetime, time, date

import random
import json
from sqlalchemy import and_

from typing import List, Optional, Any, Dict

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_phone(db: Session, phone_number: str):
    # Query User table directly now that it has phone_number
    return db.query(models.User).filter(models.User.phone_number == phone_number).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_with_phone(db: Session, phone_number: str, profile_data: Optional[dict] = None):
    """Create a user record for a phone-based user and store profile data.

    `profile_data` may contain keys matching Profile fields and will be stored.
    """
    user_id = str(uuid.uuid4())
    # Use a very simple, short password for phone-based users
    # They login via OTP, never use password
    temp_password = "phone_user_temp"  # Short and simple
    print(f"[CRUD] Hashing temp password: '{temp_password}' (len={len(temp_password)})")
    
    try:
        p_hash = get_password_hash(temp_password)
    except Exception as e:
        print(f"[CRUD] Hashing failed: {e}")
        # If hashing fails (e.g. weird passlib issue), use a simplified hash or None
        # Since these users login via OTP, password hash isn't critical
        p_hash = None # Try None as fallback

    # Extract first/last name safely
    full_name = profile_data.get("full_name", "") if profile_data else ""
    name_parts = full_name.split(" ") if full_name else []
    first_name = name_parts[0] if name_parts else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    db_user = models.User(
        id=user_id,
        email=f"{phone_number}@phone.myrush.app",
        password_hash=p_hash,
        first_name=first_name,
        last_name=last_name,
        full_name=full_name,
        phone_number=phone_number,
        # Sync profile fields directly to User table
        age=profile_data.get("age") if profile_data else None,
        city=profile_data.get("city") if profile_data else None,
        gender=profile_data.get("gender") if profile_data else None,
        handedness=profile_data.get("handedness") if profile_data else None,
        skill_level=profile_data.get("skill_level") if profile_data else None,
        playing_style=profile_data.get("playing_style") if profile_data else None,
        favorite_sports=profile_data.get("sports") if profile_data else None,
        profile_completed=True if profile_data else False
    )
    db.add(db_user)
    # prepare profile values
    profile_values = {
        "id": user_id,
        "phone_number": phone_number,
    }
    if profile_data:
        # only copy known profile fields
        allowed = [
            "full_name", "age", "city", "gender", "handedness", "skill_level", "sports", "playing_style"
        ]
        for k in allowed:
            if k in profile_data and profile_data[k] is not None:
                profile_values[k] = profile_data[k]

    db_profile = models.Profile(**profile_values)
    db.add(db_profile)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_profile(db: Session, user_id: str):
    return db.query(models.Profile).filter(models.Profile.id == user_id).first()

def create_or_update_profile(db: Session, profile: schemas.ProfileCreate, user_id: str):
    # 1. Update/Create Profile Table
    db_profile = get_profile(db, user_id)
    profile_data = profile.dict(exclude_unset=True)
    
    if db_profile:
        for key, value in profile_data.items():
            setattr(db_profile, key, value)
    else:
        db_profile = models.Profile(**profile.dict(), id=user_id)
        db.add(db_profile)
    
    # 2. Sync to User Table (CRITICAL for Dashboard/Auth response)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # Map profile fields to User fields
        if "full_name" in profile_data: user.full_name = profile_data["full_name"]
        if "age" in profile_data: user.age = profile_data["age"]
        if "city" in profile_data: user.city = profile_data["city"]
        if "gender" in profile_data: user.gender = profile_data["gender"]
        if "handedness" in profile_data: user.handedness = profile_data["handedness"]
        if "skill_level" in profile_data: user.skill_level = profile_data["skill_level"]
        if "playing_style" in profile_data: user.playing_style = profile_data["playing_style"]
        if "sports" in profile_data: user.favorite_sports = profile_data["sports"]
        
        # Sync Email (Handle unique constraint)
        if "email" in profile_data and profile_data["email"]:
            new_email = profile_data["email"].lower()
            # Check if this email is already used by ANOTHER user
            existing_user = db.query(models.User).filter(
                models.User.email == new_email,
                models.User.id != user_id
            ).first()
            if existing_user:
                print(f"[CRUD] WARNING: Cannot update email to {new_email} - already in use by user {existing_user.id}")
                # We can either raise an error or just skip. Raising error is safer for user feedback.
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="This email is already registered with another account.")
            
            user.email = new_email
            print(f"[CRUD] Synced user email to: {new_email}")

        user.profile_completed = True
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

# ============================================================================
# PAYMENT METHOD CRUD
# ============================================================================

def get_payment_methods(db: Session, user_id: str):
    return db.query(models.PaymentMethod).filter(models.PaymentMethod.user_id == user_id).all()

def create_payment_method(db: Session, payment_method: schemas.PaymentMethodCreate, user_id: str):
    # If this is set as default, unset others first
    if payment_method.is_default:
        db.query(models.PaymentMethod).filter(models.PaymentMethod.user_id == user_id).update({"is_default": False})
    
    db_payment_method = models.PaymentMethod(
        **payment_method.dict(),
        user_id=user_id
    )
    db.add(db_payment_method)
    db.commit()
    db.refresh(db_payment_method)
    return db_payment_method

def delete_payment_method(db: Session, payment_method_id: str, user_id: str):
    db_payment_method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == payment_method_id,
        models.PaymentMethod.user_id == user_id
    ).first()
    if db_payment_method:
        db.delete(db_payment_method)
        db.commit()
        return True
    return False

def set_default_payment_method(db: Session, payment_method_id: str, user_id: str):
    # Unset all
    db.query(models.PaymentMethod).filter(models.PaymentMethod.user_id == user_id).update({"is_default": False})
    # Set default
    db_payment_method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == payment_method_id,
        models.PaymentMethod.user_id == user_id
    ).first()
    if db_payment_method:
        db_payment_method.is_default = True
        db.commit()
        db.refresh(db_payment_method)
        return db_payment_method
    return None

def validate_booking_rules(
    db: Session, 
    court_id: str, 
    booking_date: date, 
    start_time: time, 
    end_time: time, 
    user_id: str, 
    slice_mask: int = 0, 
    number_of_players: int = 1,
    razorpay_order_id: str = None
):
    """
    Validate basic constraints before allowing a booking.
    Overlapping/collision is now handled ATOMICALLY via bitmasking during create_booking.
    """
    from utils.booking_utils import get_now_ist
    from fastapi import HTTPException
    from models import Booking, Court
    
    now_ist = get_now_ist()

    # Fetch court info
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found.")

    # --- Rule 1: Max Advance Booking Window (30 Days) ---
    max_days = 30
    if booking_date > now_ist.date() + timedelta(days=max_days):
        raise HTTPException(status_code=400, detail=f"Bookings can only be made up to {max_days} days in advance.")

    # --- Rule 2: Duration & Type Specific Rules ---
    start_f = start_time.hour + (start_time.minute / 60.0)
    end_f = end_time.hour + (end_time.minute / 60.0)
    if end_f == 0 and end_time.hour == 0: end_f = 24.0
    
    duration_h = end_f - start_f
    if duration_h < 0: duration_h += 24.0
    
    # Minimum duration enforcement (now 30 minutes / 0.5 hrs minimum)
    is_pool = False
    if court.facility_type:
        is_pool = court.facility_type.name.lower() == 'pool'
    
    if duration_h < 0.95: # Allow slight floating point variance
        raise HTTPException(status_code=400, detail="Minimum booking duration is 60 minutes (2 slots).")

    # --- Rule 3: User Overlap Check ---
    # Skip user overlap check for capacity courts, as users can book multiple tickets
    is_capacity = court.logic_type == 'capacity'

    if not is_capacity:
        from utils.booking_utils import safe_parse_time_float
        import json
        
        # 2. Check for simultaneous bookings by the same user (Double booking prevention)
        user_bookings_query = db.query(Booking).filter(
            Booking.user_id == user_id,
            Booking.booking_date == booking_date,
            Booking.status != 'cancelled'
        )
        
        if razorpay_order_id:
             # IMPORTANT: Skip collision check with bookings from the SAME transaction/order.
             # This allows multi-court confirmation to succeed for all courts in the order.
             user_bookings_query = user_bookings_query.filter(Booking.razorpay_order_id != razorpay_order_id)
             
        user_bookings = user_bookings_query.all()
        
        if user_bookings:
            for b in user_bookings:
                # Robustly extract start/end time
                if b.start_time:
                    b_start = b.start_time.hour + (b.start_time.minute / 60.0)
                    b_end = (b.end_time.hour + (b.end_time.minute / 60.0)) if b.end_time else (b_start + 0.5)
                else:
                    # Fallback to time_slots JSON
                    t_slots = b.time_slots
                    if isinstance(t_slots, str):
                        try: t_slots = json.loads(t_slots)
                        except: t_slots = []
                    
                    if t_slots and isinstance(t_slots, list):
                        s_str = t_slots[0].get('start_time') or t_slots[0].get('time')
                        e_str = t_slots[-1].get('end_time')
                        b_start = safe_parse_time_float(s_str)
                        b_end = safe_parse_time_float(e_str) if e_str else (b_start + 0.5)
                    else:
                        continue

                if b_end == 0 or b_end == 24.0: b_end = 24.0
                if max(start_f, b_start) < min(end_f, b_end):
                    # We have a time overlap. Now check if it's a structural conflict.
                    # 1. Is it the exact same section of the court?
                    is_same_court = False
                    
                    # NEW: Robust Shared Group check
                    # If both courts are in the same shared group, we must check their masks against each other
                    if str(b.court_id) == str(court_id):
                        is_same_court = True
                    else:
                        # Check if they share a group
                        other_court = db.query(Court).filter(Court.id == b.court_id).first()
                        if other_court and other_court.shared_group_id and court.shared_group_id:
                            if str(other_court.shared_group_id) == str(court.shared_group_id):
                                is_same_court = True
                    
                    if is_same_court:
                        # Current court total zones
                        c_zones = court.total_zones or 1
                        # Other court (from booking) total zones
                        other_court_record = db.query(Court).filter(Court.id == b.court_id).first()
                        o_zones = other_court_record.total_zones if other_court_record else 1
                        
                        existing_mask = b.slice_mask if b.slice_mask is not None else ((1 << o_zones) - 1)
                        new_mask = slice_mask if slice_mask is not None else ((1 << c_zones) - 1)
                        
                        if (existing_mask & new_mask) != 0:
                            raise HTTPException(
                                status_code=400, 
                                detail=f"Overlap Conflict: You already have another booking ({b.booking_display_id}) for a shared part of this arena during this time."
                            )

    print("[RULES CHECK] Basic validation passed. Collisions checked atomically.")


def validate_court_configuration(db: Session, court_id: str, booking_date: date, requested_slots: List[Dict[str, Any]], number_of_players: int, expected_total_amount: float, slice_mask: Optional[int] = None, num_courts: int = 1):
    """
    Ensures the requested slots exist in the court's configuration and the price is correct.
    """
    from fastapi import HTTPException
    from utils.booking_utils import generate_allowed_slots_map, safe_parse_time_float
    from models import Court

    court = db.query(Court).filter(Court.id == court_id).first()
    is_capacity = court.logic_type == 'capacity' if court else False

    # 1. Generate Authoritative Slots Map
    allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)

    if not allowed_slots_map:
        raise HTTPException(status_code=400, detail="The venue is closed or not configured for this date.")

    # 2. Validate Each REQUESTED Slot
    calculated_total_base = 0.0
    for req in requested_slots:
        r_start = req.get('time') or req.get('start_time')
        if not r_start: continue
        
        slot_f = safe_parse_time_float(r_start)
        hh = int(slot_f); mm = int((slot_f % 1)*60)
        norm_start = f"{hh:02d}:{mm:02d}"
        
        if norm_start not in allowed_slots_map:
            raise HTTPException(status_code=400, detail=f"Slot starting at {r_start} is not available.")
        
        server_slot = allowed_slots_map[norm_start]
        if server_slot['is_blocked']:
             raise HTTPException(status_code=400, detail="This slot has been blocked by Admin.")
            
        expected_price = float(server_slot['price'])
        
        # NEW: Sum slice prices if mask provided, otherwise use default from slot engine
        from utils.booking_utils import calculate_multi_slice_price
        expected_price = calculate_multi_slice_price(server_slot, slice_mask or 0, float(server_slot['price']))

        provided_price = float(req.get('price') if req.get('price') is not None else 0)
        
        # For capacity sports, the frontend multiplies the slot price by numPlayers
        expected_slot_provided_price = (expected_price * number_of_players) if is_capacity else expected_price

        # Allow small rounding difference
        if abs(expected_slot_provided_price - provided_price) > 5.0:
             print(f"[CONFIG CHECK FAIL] Price mismatch for slot '{r_start}':")
             print(f"  - Expected Price: {expected_price} (Base) * {number_of_players} (Players) = {expected_slot_provided_price}")
             print(f"  - Provided Price: {provided_price}")
             print(f"  - Court logic: {court.logic_type if court else 'unknown'}")
             raise HTTPException(status_code=400, detail=f"Price mismatch for slot {r_start}")
             
        calculated_total_base += expected_price

    # 3. Validate Total Amount
    # For 'capacity' type (pools), total = sum(prices) * number_of_players
    # For others, total = sum(prices)
    if is_capacity:
        calculated_final_total = float(calculated_total_base * number_of_players)
    else:
        calculated_final_total = float(calculated_total_base)

    # If num_courts is provided > 1, the client is sending a combined total for a group of bookings.
    # In such cases, we expect BOTH the server total and the client-provided total to be the SAME 
    # (as long as the caller correctly split the totals).
    effective_expected_amount = float(expected_total_amount)
    
    # NEW logic: If the client explicitly says num_courts > 1 AND it's sending the ENTIRE order total,
    # then we divide. BUT if the client is already sending the per-court total, we don't divide.
    # A safer check is: if the calculated total is much smaller than provided, and num_courts > 1, try dividing.
    # But even better: ensure the caller passes the EXACT amount expected for THIS court.
    
    # For compatibility with existing multi-court logic that sends combined total in 'isFirst' request:
    if num_courts and num_courts > 1 and abs(calculated_final_total - (effective_expected_amount / num_courts)) < 10.0:
        effective_expected_amount = effective_expected_amount / num_courts

    print(f"[CONFIG CHECK] Final Calculation ({court.logic_type if court else 'unknown'}): {calculated_final_total}")
    print(f"[CONFIG CHECK] Comparison: Server={calculated_final_total} vs Client={effective_expected_amount} (original={expected_total_amount}, num_courts={num_courts})")

    if abs(calculated_final_total - effective_expected_amount) > 10.0:
         print(f"[CONFIG CHECK FAIL] Total amount mismatch:")
         print(f"  - Calculated Server Total: {calculated_final_total}")
         print(f"  - Effective Client Amount: {effective_expected_amount}")
         print(f"  - Num Courts: {num_courts}")
         raise HTTPException(status_code=400, detail=f"Total booking amount mismatch. Server={calculated_final_total}, Client={effective_expected_amount}")


    print("[CONFIG CHECK] Success.")


def create_booking(db: Session, booking: schemas.BookingCreate, user_id: str):
    try:
        print(f"[CRUD BOOKING] Starting booking creation for user: {user_id}")

        # 1. Prepare Time Slots & Duration
        time_slots = []
        total_duration = 0
        start_time_val = None
        end_time_val = None
        
        from datetime import datetime as dt, time, timedelta
        import re
        import random
        import string

        def generate_booking_display_id():
            chars = string.ascii_uppercase + string.digits
            suffix = ''.join(random.choices(chars, k=6))
            return f"BK-{suffix}"
        
        from utils.booking_utils import safe_parse_time_float
        
        # New Booking ID
        new_display_id = generate_booking_display_id()

        # Check if multi-slot data is provided (New Flow)
        if booking.time_slots and len(booking.time_slots) > 0:
            sanitized_slots = []
            for slot in booking.time_slots:
                raw_time = slot.get('time') or slot.get('start_time')
                price = slot.get('price')
                
                s_float = safe_parse_time_float(raw_time)
                sh = int(s_float); sm = int((s_float % 1)*60)
                s_time = time(sh, sm)
                
                # Assume 30 mins per slot
                raw_end = slot.get('end_time')
                if raw_end:
                     e_float = safe_parse_time_float(raw_end)
                     eh = int(e_float); em = int((e_float % 1)*60)
                     e_time = time(eh % 24, em)
                else:
                     em = (sm + 30) % 60
                     eh = (sh + (sm + 30)//60) % 24
                     e_time = time(eh, em)
                
                sanitized_slots.append({
                    "start_time": s_time.strftime("%H:%M"),
                    "end_time": e_time.strftime("%H:%M"),
                    "price": price,
                    "display_time": slot.get('display_time') or f"{s_time.strftime('%I:%M %p')} - {e_time.strftime('%I:%M %p')}"
                })
            
            time_slots = sanitized_slots
            total_duration = len(time_slots) * 30 
            
            if len(time_slots) > 0:
                s_f = safe_parse_time_float(time_slots[0]['start_time'])
                start_time_val = time(int(s_f), int((s_f % 1)*60))
                e_f = safe_parse_time_float(time_slots[-1]['end_time'])
                end_time_val = time(int(e_f) % 24, int((e_f % 1)*60))
            else:
                start_time_val = time(10, 0); end_time_val = time(11, 0)

        else:
            # Legacy Flow (Single Slot)
            print("[CRUD BOOKING] Processing legacy single-slot booking")
            time_str = str(booking.start_time).strip()
            
            s_h = safe_parse_hour(time_str)
            start_time_val = time(s_h, 0)
            
            total_duration = booking.duration_minutes
            # Calculate end time by adding duration
            dummy_dt = dt.combine(dt.today(), start_time_val) + timedelta(minutes=total_duration)
            end_time_val = dummy_dt.time()
            
            time_slots = [{
                "start_time": start_time_val.strftime("%H:%M"),
                "end_time": end_time_val.strftime("%H:%M"),
                "price": booking.price_per_hour,
                "display_time": f"{start_time_val.strftime('%I:%M %p')} - {end_time_val.strftime('%I:%M %p')}"
            }]

        # 2. Calculate Amounts
        # Use provided breakdown if available, else calculate
        if booking.original_amount is not None:
             original_amount = booking.original_amount
             discount_amount = booking.discount_amount or 0
             # Recalculate total just in case or trust frontend? Trust frontend for now but validate
             # total_amount = original_amount - discount_amount
             # Use the total_amount logic from legacy if needed, but preference to new mapping
        else:
            # Legacy Calculation
            price_per_hour = booking.price_per_hour or 200.0
            calculated_total = price_per_hour * (booking.duration_minutes / 60.0)
            original_amount = calculated_total # Assuming no discount unless coupon passed separately?
            discount_amount = 0
        
        # Determine final total amount to store
        # In legacy, there wasn't a separate 'total_amount' field in BookingCreate, it was calculated.
        # So we use the calculated one.
        subtotal_amount = float(original_amount) - float(discount_amount)
        
        # --- GST Calculation ---
        gst_amount = 0
        total_amount = subtotal_amount
        
        try:
            active_gst_policy = db.query(models.AdminPolicy).filter(
                models.AdminPolicy.type == 'gst',
                models.AdminPolicy.is_active == True
            ).first()
            
            if active_gst_policy and active_gst_policy.value:
                gst_percent = float(active_gst_policy.value)
                gst_amount = (subtotal_amount * gst_percent) / 100
                total_amount = subtotal_amount + gst_amount
                print(f"[CRUD BOOKING] GST Applied: {gst_percent}% -> {gst_amount}. New Total: {total_amount}")
        except Exception as ge:
            print(f"[CRUD BOOKING] Warning: Failed to fetch/apply GST policy: {ge}")

        # 3. Verify Court & User
        court_check = db.query(models.Court).filter(models.Court.id == str(booking.court_id)).first()
        
        if not court_check:
            raise ValueError(f"Court {booking.court_id} not found in admin_courts table")
            
        from uuid import UUID
        c_uuid = UUID(str(booking.court_id))
        is_capacity = court_check.logic_type == 'capacity'

        # --- ATOMIC LOCKING & VALIDATION ---
        # Acquire row-level lock on the court OR the entire shared group
        if court_check.shared_group_id:
            print(f"[CRUD BOOKING] Shared Group detected! Locking all courts in group {court_check.shared_group_id}")
            db.query(models.Court).filter(models.Court.shared_group_id == court_check.shared_group_id).with_for_update().all()
        else:
            print(f"[CRUD BOOKING] Independent court. Locking court {c_uuid}")
            db.query(models.Court).filter(models.Court.id == c_uuid).with_for_update().first()

        # --- FRAUD CHECK: DOUBLE SPEND / REPLAY ATTACK ---
        if booking.razorpay_payment_id:
            from fastapi import HTTPException
            existing_payment = db.query(models.Booking).filter(models.Booking.payment_id == booking.razorpay_payment_id).first()
            if existing_payment:
                print(f"[FRAUD ALERT] Payment ID {booking.razorpay_payment_id} already used for Booking {existing_payment.id}!")
                raise HTTPException(status_code=409, detail="Transaction already processed. This payment receipt has already been used.")

        # 1. Basic Rules
        validate_booking_rules(
            db=db,
            court_id=str(c_uuid),
            booking_date=booking.booking_date,
            start_time=start_time_val,
            end_time=end_time_val,
            user_id=user_id,
            slice_mask=booking.slice_mask,
            number_of_players=booking.number_of_players or 1,
            razorpay_order_id=booking.razorpay_order_id
        )

        # 2. Config & Price
        validate_court_configuration(
            db=db,
            court_id=str(c_uuid),
            booking_date=booking.booking_date,
            requested_slots=time_slots,
            expected_total_amount=original_amount,
            number_of_players=booking.number_of_players or 1,
            slice_mask=booking.slice_mask,
            num_courts=booking.num_courts or 1
        )
        
        user_exists = db.query(models.User).filter(models.User.id == user_id).first()
        if not user_exists:
            raise ValueError(f"User {user_id} not found")

        # 3. Fast Atomic Allocation (via slots table if slot_ids provided)
        if booking.slot_ids:
            from sqlalchemy import text
            for slot_id in booking.slot_ids:
                if is_capacity:
                    # Capacity Based: Atomically increment booked_capacity
                    num_players = booking.number_of_players or 1
                    result = db.execute(
                        text("""
                        UPDATE slots
                        SET booked_capacity = COALESCE(booked_capacity, 0) + :num_players
                        WHERE id = :slot_id
                        AND (COALESCE(booked_capacity, 0) + :num_players) <= COALESCE(capacity_limit, 1)
                        RETURNING id
                        """),
                        {"slot_id": slot_id, "num_players": num_players}
                    )
                    if not result.fetchone():
                        db.rollback()
                        raise ValueError(f"Conflict: Slot capacity limit reached or slot unavailable.")
                else:
                    # Regular Court: Atomically update bitmask
                    if booking.slice_mask is not None:
                        # Check if this slot was ALREADY claimed by the same order (to avoid self-collision)
                        already_claimed = False
                        if booking.razorpay_order_id:
                            existing_order_booking = db.query(models.Booking).filter(
                                models.Booking.razorpay_order_id == booking.razorpay_order_id,
                                models.Booking.court_id == str(c_uuid),
                                models.Booking.slice_mask == booking.slice_mask
                            ).first()
                            if existing_order_booking:
                                already_claimed = True

                        if not already_claimed:
                            result = db.execute(
                                text("""
                                UPDATE slots
                                SET occupied_mask = COALESCE(occupied_mask, 0) | :mask
                                WHERE id = :slot_id
                                AND (COALESCE(occupied_mask, 0) & :mask) = 0
                                RETURNING id
                                """),
                                {"slot_id": slot_id, "mask": booking.slice_mask}
                            )
                            if not result.fetchone():
                                db.rollback()
                                raise ValueError(f"Conflict: Slot is no longer available for the requested part of the field.")

        else:
            # --- FALLBACK: No slot_ids provided. Use bookings table for collision detection. ---
            # IMPORTANT: Skip fallback collision check for capacity-based courts (Swimming/Skating)
            # as they allow overlapping bookings.
            if not is_capacity:
                from fastapi import HTTPException as FHTTPException
                s_f = start_time_val.hour + (start_time_val.minute / 60.0)
                e_f = end_time_val.hour + (end_time_val.minute / 60.0)
                if e_f == 0: e_f = 24.0

                existing_bookings = db.query(models.Booking).filter(
                    models.Booking.court_id == str(c_uuid),
                    models.Booking.booking_date == booking.booking_date,
                    models.Booking.status != 'cancelled',
                    models.Booking.payment_status.in_(['pending', 'paid', 'confirmed'])
                )
                # Exclude same razorpay_order_id (allows multi-court same-order)
                if booking.razorpay_order_id:
                    existing_bookings = existing_bookings.filter(
                        models.Booking.razorpay_order_id != booking.razorpay_order_id
                    )

                for eb in existing_bookings.all():
                    eb_start = eb.start_time.hour + (eb.start_time.minute / 60.0) if eb.start_time else 0
                    eb_end = eb.end_time.hour + (eb.end_time.minute / 60.0) if eb.end_time else 24.0
                    if eb_end == 0: eb_end = 24.0

                    # Check time overlap
                    if max(s_f, eb_start) < min(e_f, eb_end):
                        # Check bitmask conflict
                        new_mask = booking.slice_mask if booking.slice_mask is not None else ((1 << (court_check.total_zones or 1)) - 1)
                        ex_mask = eb.slice_mask if eb.slice_mask is not None else ((1 << (court_check.total_zones or 1)) - 1)
                        if (new_mask & ex_mask) != 0:
                            print(f"[CRUD BOOKING] DOUBLE BOOKING BLOCKED: Conflict with booking {eb.id} (mask={ex_mask}, new_mask={new_mask})")
                            db.rollback()
                            raise FHTTPException(
                                status_code=409,
                                detail=f"This slot is already booked (Booking {eb.booking_display_id}). Please choose a different time."
                            )


        # 4. Finalize Time Slots with Court Name
        final_slots = []
        for slot in time_slots:
            final_slots.append({**slot, "court_name": court_check.name})

        # 5. Create Booking
        booking_data = {
            "user_id": user_id,
            "court_id": str(c_uuid),
            "booking_date": booking.booking_date,
            "booking_display_id": new_display_id,
            "invoice_number": f"INV-{new_display_id}",
            
            # New Columns
            "time_slots": final_slots,
            "total_duration_minutes": total_duration,
            "original_amount": original_amount,
            "subtotal_amount": subtotal_amount,
            "gst_amount": gst_amount,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "coupon_code": booking.coupon_code,
            "slice_mask": booking.slice_mask,
            "slot_id": str(booking.slot_ids[0]) if booking.slot_ids else None,
            
            # Deprecated Columns (Populated for backward compatibility)
            "start_time": start_time_val,
            "end_time": end_time_val,
            "duration_minutes": total_duration,
            "price_per_hour": booking.price_per_hour or 0,

            # Legacy fields required by DB constraints
            "_old_start_time": start_time_val,
            "_old_end_time": end_time_val,
            "_old_duration_minutes": total_duration,
            "_old_price_per_hour": booking.price_per_hour or 0,
            
            # Other fields
            "number_of_players": booking.number_of_players,
            "team_name": booking.team_name,
            "special_requests": booking.special_requests,
            "status": booking.status or "confirmed",
            "payment_status": booking.payment_status or "pending",
            "payment_id": booking.razorpay_payment_id,
            "razorpay_order_id": booking.razorpay_order_id,
            "razorpay_signature": booking.razorpay_signature,
        }

        print(f"[CRUD BOOKING] Creating booking record in DB for {user_id}")

        db_booking = models.Booking(**booking_data)
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)

        # 5. Increment Coupon Usage Count if used
        if booking.coupon_code:
            try:
                increment_coupon_usage(db, booking.coupon_code)
            except Exception as ce:
                print(f"[CRUD BOOKING] Warning: Failed to increment coupon usage: {ce}")

        print(f"[CRUD BOOKING] SUCCESS: Booking created with ID: {db_booking.id}")

        # --- INTEGRATION TRIGGER (Phase 2) ---
        try:
            from services.integrations.orchestrator import IntegrationOrchestrator
            from utils.booking_utils import safe_parse_time_float
            for slot in time_slots:
                s_f = safe_parse_time_float(slot['start_time'])
                IntegrationOrchestrator.notify_inventory_change(
                    db=db,
                    court_id=str(db_booking.court_id),
                    date=str(db_booking.booking_date),
                    slot_start=s_f,
                    action='block'
                )
        except Exception as ite:
            print(f"[CRUD BOOKING] Warning: Integration trigger failed: {ite}")

        return db_booking

    except ValueError as ve:
         raise ve
    except Exception as e:
        print(f"[CRUD BOOKING] ERROR: Exception during booking creation: {e}")
        import traceback
        traceback.print_exc()
        raise e

def create_otp_record(db: Session, phone_number: str, otp_code: str, expires_at: datetime):
    otp = models.OtpVerification(
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def verify_otp_record(db: Session, phone_number: str, otp_code: str):
    now = datetime.utcnow()
    otp = db.query(models.OtpVerification).filter(
        and_(models.OtpVerification.phone_number == phone_number,
             models.OtpVerification.otp_code == otp_code,
             models.OtpVerification.expires_at >= now,
             models.OtpVerification.is_verified == False)
    ).first()
    if not otp:
        return None
    otp.is_verified = True
    db.commit()
    db.refresh(otp)
    return otp

def cancel_booking(db: Session, booking_id: str, user_id: str):
    """
    Cancel a booking if it's at least 1 hour before the start time.
    """
    from models import Booking
    from utils.booking_utils import get_now_ist
    from fastapi import HTTPException
    from services.integrations.orchestrator import IntegrationOrchestrator

    db_booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == user_id
    ).first()

    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found or access denied.")

    if db_booking.status == 'cancelled':
        raise HTTPException(status_code=400, detail="Booking is already cancelled.")

    # 1-hour cancellation rule
    now_ist = get_now_ist()
    booking_start = datetime.combine(db_booking.booking_date, db_booking.start_time)
    
    # Check if cancellation is within 1 hour of start time
    if booking_start - now_ist < timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Cancellations are only allowed up to 1 hour before the booked time.")

    # --- PROCESS AUTOMATED REFUND ---
    if db_booking.payment_status == 'paid' and db_booking.payment_id:
        import razorpay
        import os
        try:
            print(f"[CRUD] Initiating automatic refund for booking {booking_id}, payment {db_booking.payment_id}")
            client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
            
            refund_amount_paise = int(db_booking.total_amount * 100)
            
            refund = client.payment.refund(db_booking.payment_id, {
                "amount": refund_amount_paise,
                "notes": {
                    "reason": "User cancelled booking",
                    "booking_id": str(db_booking.id)
                }
            })
            print(f"[CRUD] Successfully processed refund: {refund.get('id')}")
            db_booking.payment_status = 'refunded'
        except Exception as e:
            print(f"[CRUD] Razorpay Refund Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to process automatic refund: {str(e)}. Please contact support.")

    # Update status
    db_booking.status = 'cancelled'
    db_booking.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_booking)

    # Release inventory
    try:
        from utils.booking_utils import safe_parse_time_float
        for slot in (db_booking.time_slots or []):
            s_f = safe_parse_time_float(slot.get('start_time'))
            IntegrationOrchestrator.notify_inventory_change(
                db=db,
                court_id=str(db_booking.court_id),
                date=str(db_booking.booking_date),
                slot_start=s_f,
                action='available'
            )
    except Exception as e:
        print(f"[CRUD] Warning: Failed to release inventory after cancellation: {e}")

    return db_booking

def get_bookings(db: Session, user_id: str):
    """Get all bookings for a user, enriched with court name and venue location."""
    try:
        print(f"[CRUD] Getting bookings for user: {user_id}")

        from sqlalchemy import text
        query = text("""
            SELECT
                b.id,
                b.user_id,
                b.court_id,
                b.booking_display_id,
                b.booking_date,
                b._deprecated_start_time_v2 AS start_time,
                b._deprecated_end_time_v2 AS end_time,
                b._deprecated_duration_minutes_v2 AS duration_minutes,
                b._deprecated_price_per_hour_v2 AS price_per_hour,
                b._deprecated_original_price_per_hour_v2 AS original_price_per_hour,
                b.time_slots,
                b.total_duration_minutes,
                b.original_amount,
                b.discount_amount,
                b.coupon_code,
                b.number_of_players,
                b.team_name,
                b.special_requests,
                b.total_amount,
                b.status,
                b.payment_status,
                b.created_at,
                b.updated_at,
                br.name AS venue_name,
                br.address_line1 AS venue_location,
                c.name AS court_real_name,
                COALESCE(b.subtotal_amount, 0.0) AS subtotal_amount,
                COALESCE(b.gst_amount, 0.0) AS gst_amount,
                c.logic_type,
                b.slice_mask,
                COALESCE(
                    (SELECT json_agg(json_build_object('index', cz.zone_index, 'name', cz.zone_name))
                     FROM admin_court_zones cz
                     WHERE cz.court_id = c.id),
                    '[]'::json
                ) as zones,
                c.total_zones,
                a.name as area_name
            FROM booking b
            LEFT JOIN admin_courts c ON b.court_id::text = c.id::text
            LEFT JOIN admin_branches br ON c.branch_id::text = br.id::text
            LEFT JOIN admin_areas a ON br.area_id::text = a.id::text
            WHERE b.user_id = :user_id
            ORDER BY b.booking_date DESC, b._deprecated_start_time_v2 DESC
        """)

        result = db.execute(query, {"user_id": str(user_id)}).fetchall()
        print(f"[CRUD] Found {len(result)} bookings")

        import json
        bookings_list = []
        for row in result:
            # Parse time_slots from JSON string if needed
            raw_time_slots = row[10]
            if isinstance(raw_time_slots, str):
                try:
                    time_slots_parsed = json.loads(raw_time_slots)
                except Exception:
                    time_slots_parsed = []
            elif isinstance(raw_time_slots, list):
                time_slots_parsed = raw_time_slots
            else:
                time_slots_parsed = []

            # Build venue_location: prefer address_line1, fall back to branch name
            venue_location = row[24] or row[23] or "Unknown Location"
            
            # Composite venue name: "Rush (Madhapur)"
            display_venue_name = row[23] or "Unknown Venue"
            if row[32]: # area_name
                display_venue_name = f"{display_venue_name} ({row[32]})"

            booking_dict = {
                "id": row[0],
                "user_id": row[1],
                "court_id": row[2],
                "booking_display_id": row[3],
                "booking_date": row[4],
                "start_time": row[5],
                "end_time": row[6],
                "duration_minutes": row[7],
                "price_per_hour": row[8],
                "original_price_per_hour": row[9],
                "time_slots": time_slots_parsed,
                "total_duration_minutes": row[11] or 0,
                "original_amount": row[12],
                "discount_amount": row[13] or 0,
                "coupon_code": row[14],
                "number_of_players": row[15] or 2,
                "team_name": row[16],
                "special_requests": row[17],
                "total_amount": row[18],
                "status": row[19],
                "payment_status": row[20],
                "created_at": row[21],
                "updated_at": row[22],
                "venue_name": display_venue_name,
                "venue_location": venue_location,
                "court_name": row[25] or "Unknown Sport",
                "subtotal_amount": row[26] or 0.0,
                "gst_amount": row[27] or 0.0,
                "logic_type": row[28],
                "slice_mask": row[29],
                "total_zones": row[31] or 1,
                "zones": row[30] if isinstance(row[30], list) else json.loads(row[30]) if row[30] else []
            }
            bookings_list.append(booking_dict)

        return bookings_list

    except Exception as e:
        print(f"[CRUD] Critical error getting bookings for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return []


def create_review(db: Session, review: schemas.ReviewCreate, user_id: str):
    print(f"[CRUD] create_review called for user={user_id}, booking={review.booking_id}")
    try:
        from uuid import UUID
        try:
            b_uuid = UUID(str(review.booking_id))
            c_uuid = UUID(str(review.court_id))
        except ValueError:
            print("[CRUD] Invalid UUID format")
            raise ValueError("Invalid Booking ID or Court ID format")

        try:
            # Check table existence (hacky but useful for debug)
            db.execute(text("SELECT 1 FROM reviews LIMIT 1"))
        except Exception as e:
            print(f"[CRUD] Table check failed: {e}")
            # Do not raise, maybe table is empty, just catch if table missing error occurs later

        # Check if review already exists for this booking
        print("[CRUD] Checking existing review...")
        existing_review = db.query(models.Review).filter(
            models.Review.booking_id == str(b_uuid)
        ).first()

        if existing_review:
            raise ValueError("Review already exists for this booking")

        # Verify the booking belongs to the user
        print("[CRUD] Verifying booking ownership...")
        booking = db.query(models.Booking).filter(
            models.Booking.id == str(b_uuid),
            models.Booking.user_id == user_id
        ).first()

        if not booking:
            print("[CRUD] Booking not found or mismatch")
            raise ValueError("Booking not found or does not belong to user")

        # Check if booking is completed (past end time)
        print("[CRUD] Checking completion status...")
        try:
            booking_end_time = datetime.combine(booking.booking_date, booking.end_time)
            if booking_end_time > datetime.now():
                raise ValueError("Cannot review booking that is not yet completed")
        except Exception as e:
            print(f"[CRUD] Date comparison error: {e}")
            # Proceed if date check fails (for now) or raise?
            pass

        print("[CRUD] Creating review object...")
        db_review = models.Review(
            user_id=user_id,
            booking_id=str(b_uuid),
            court_id=str(c_uuid),
            rating=review.rating,
            review_text=review.review_text
        )
        
        print("[CRUD] Adding to session...")
        db.add(db_review)
        print("[CRUD] Committing...")
        db.commit()
        print("[CRUD] Refreshing...")
        db.refresh(db_review)
        return db_review

    except ValueError as ve:
        print(f"[CRUD] Validation Error: {ve}")
        raise ve
    except Exception as e:
        print(f"[CRUD] Database/Server Error: {e}")
        db.rollback()
        # Check specifically for table missing
        if "relation \"reviews\" does not exist" in str(e):
             raise ValueError("System Error: Reviews table missing. Please report to admin.")
        raise e

def get_user_reviews(db: Session, user_id: str):
    try:
        # Use raw SQL query to ensure proper UUID comparison and filter by is_active
        from sqlalchemy import text
        query = text("""
            SELECT
                r.id, r.user_id, r.booking_id, r.court_id, r.rating,
                r.review_text, r.created_at, r.updated_at,
                c.name as court_name
            FROM reviews r
            LEFT JOIN admin_courts c ON r.court_id::text = c.id::text
            WHERE r.user_id = :user_id AND r.is_active = true
            ORDER BY r.created_at DESC
        """)

        result = db.execute(query, {"user_id": user_id}).fetchall()

        # Convert to list of dicts
        reviews_list = []
        for row in result:
            review_dict = {
                "id": row[0],
                "user_id": row[1],
                "booking_id": row[2],
                "court_id": row[3],
                "court_name": row[8] if len(row) > 8 and row[8] else f"Court {row[3]}",  # court_name from join
                "rating": row[4],
                "review_text": row[5],
                "created_at": row[6],
                "updated_at": row[7]
            }
            reviews_list.append(review_dict)

        return reviews_list
    except Exception as e:
        # If reviews table doesn't exist or query fails, return empty list
        print(f"[CRUD] User reviews query failed: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_reviews_for_court(db: Session, court_id: str):
    try:
        return db.query(models.Review).filter(models.Review.court_id == court_id).all()
    except Exception as e:
        # If reviews table doesn't exist, return empty list
        print(f"[CRUD] Reviews table query failed: {e}")
        return []

def has_user_reviewed_booking(db: Session, user_id: str, booking_id: str):
    try:
        review = db.query(models.Review).filter(
            models.Review.user_id == user_id,
            models.Review.booking_id == booking_id
        ).first()
        return review
    except Exception as e:
        # If reviews table doesn't exist or there's any database error, return None
        print(f"[CRUD] Reviews table query failed: {e}")
        return None

def get_unreviewed_completed_bookings(db: Session, user_id: str):
    """Get bookings that haven't been reviewed yet and have passed their end time using efficient LEFT JOIN"""
    try:
        print(f"[CRUD] Getting unreviewed completed bookings for user: {user_id}")

        # Use efficient LEFT JOIN query to find bookings without reviews that have passed end time
        from sqlalchemy import text
        query = text("""
            SELECT
                b.id, b.court_id, b.booking_date, b.start_time, b.end_time,
                c.name as court_name
            FROM booking b
            LEFT JOIN reviews r ON b.id = r.booking_id
            LEFT JOIN admin_courts c ON b.court_id::text = c.id::text
            WHERE b.user_id = :user_id
            AND r.id IS NULL
            AND (b.booking_date + b.end_time) < NOW()
            ORDER BY (b.booking_date + b.end_time) DESC
            LIMIT 5
        """)

        print(f"[CRUD] Executing LEFT JOIN query for user: {user_id}")
        result = db.execute(query, {"user_id": user_id}).fetchall()
        print(f"[CRUD] Query returned {len(result)} rows")

        unreviewed_bookings = []
        for row in result:
            booking_dict = {
                "id": row[0],
                "court_id": row[1],
                "court_name": row[5] if row[5] else f"Court {row[1]}",
                "booking_date": row[2],
                "start_time": row[3],
                "end_time": row[4],
                "venue_name": "Unknown Venue"  # Placeholder
            }
            unreviewed_bookings.append(booking_dict)
            print(f"[CRUD] Found unreviewed booking: {row[0]} - {booking_dict['court_name']}")

        print(f"[CRUD] Returning {len(unreviewed_bookings)} unreviewed completed bookings")
        return unreviewed_bookings

    except Exception as e:
        print(f"[CRUD] Error getting unreviewed completed bookings: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_cities(db: Session):
    return db.query(models.City).filter(models.City.is_active == True).all()

def get_game_types(db: Session):
    return db.query(models.GameType).filter(models.GameType.is_active == True).all()

def get_branches(db: Session, city_id: str = None):
    """Get all active branches, optionally filtered by city_id"""
    query = db.query(models.Branch).filter(models.Branch.is_active == True)
    if city_id:
        query = query.filter(models.Branch.city_id == city_id)
    return query.all()


# Push Token CRUD Functions

def get_top_players(db: Session, limit: int = 10):
    """
    Get top players based on profile completion and activity.
    In a real app, this would use actual ratings/bookings analysis.
    For now, we fetch users with full_name and assign a stable pseudo-rating.
    """
    users = db.query(models.User).filter(
        models.User.full_name != None,
        models.User.full_name != '',
        models.User.is_active == True
    ).limit(limit).all()
    
    players = []
    for user in users:
        # Generate a semi-stable rating based on user ID for realism
        user_uuid_str = str(user.id)
        # Use first 4 chars of UUID as integer for seeding
        try:
            seed_val = int(user_uuid_str.replace('-', '')[:4], 16)
            random.seed(seed_val)
        except:
            random.seed(42)
            
        rating = round(random.uniform(4.5, 5.0), 1)
        players.append({
            "id": str(user.id),
            "name": user.full_name,
            "rating": rating,
            "avatar_url": user.avatar_url
        })
    
    # Sort by rating descending
    players.sort(key=lambda x: x['rating'], reverse=True)
    return players
def create_push_token(db: Session, token_data: schemas.PushTokenCreate, user_id: str):
    """Create or update a push token for a user"""
    try:
        # Check if token already exists
        existing_token = db.query(models.PushToken).filter(
            models.PushToken.device_token == token_data.device_token
        ).first()

        if existing_token:
            # Update existing token
            existing_token.user_id = user_id
            existing_token.device_type = token_data.device_type
            existing_token.device_info = token_data.device_info
            existing_token.is_active = True
            existing_token.last_used_at = func.now()
            db.commit()
            db.refresh(existing_token)
            return existing_token
        else:
            # Create new token
            db_token = models.PushToken(
                user_id=user_id,
                device_token=token_data.device_token,
                device_type=token_data.device_type,
                device_info=token_data.device_info,
                is_active=True
            )
            db.add(db_token)
            db.commit()
            db.refresh(db_token)
            return db_token

    except Exception as e:
        print(f"[CRUD] Error creating/updating push token: {e}")
        raise

def get_push_tokens_for_user(db: Session, user_id: str):
    """Get all active push tokens for a user"""
    return db.query(models.PushToken).filter(
        models.PushToken.user_id == user_id,
        models.PushToken.is_active == True
    ).all()

def get_active_push_tokens(db: Session, user_ids: list = None):
    """Get active push tokens for specific users or all users"""
    query = db.query(models.PushToken).filter(models.PushToken.is_active == True)

    if user_ids:
        query = query.filter(models.PushToken.user_id.in_(user_ids))

    return query.all()

def deactivate_push_token(db: Session, device_token: str):
    """Deactivate a push token"""
    token = db.query(models.PushToken).filter(
        models.PushToken.device_token == device_token
    ).first()

    if token:
        token.is_active = False
        token.updated_at = func.now()
        db.commit()
        return True

    return False

def update_push_token_last_used(db: Session, device_token: str):
    """Update last_used_at timestamp for a token"""
    token = db.query(models.PushToken).filter(
        models.PushToken.device_token == device_token
    ).first()

    if token:
        token.last_used_at = func.now()
        db.commit()
        return True

    return False

def cleanup_inactive_tokens(db: Session, days_old: int = 30):
    """Clean up inactive tokens older than specified days"""
    from datetime import datetime, timedelta

    cutoff_date = datetime.utcnow() - timedelta(days=days_old)

    deleted_count = db.query(models.PushToken).filter(
        models.PushToken.is_active == False,
        models.PushToken.updated_at < cutoff_date
    ).delete()

    db.commit()
    return deleted_count
