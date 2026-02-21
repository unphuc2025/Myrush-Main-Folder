from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func, text
import models, schemas
from utils.coupon_utils import increment_coupon_usage
from passlib.context import CryptContext
import uuid
from datetime import timedelta, datetime
import random
from sqlalchemy import and_
from typing import Optional

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

def validate_booking_rules(db: Session, user_id: str, court_id: str, booking_date: datetime.date, start_time: datetime.time, end_time: datetime.time, duration_minutes: int):
    """
    Enforce critical booking rules:
    1. Double Booking (Overlap)
    2. User Overlap (Same user, same time)
    3. Max Window (30 days)
    4. Max Duration (4 hours)
    5. Past Time Check
    """
    from fastapi import HTTPException
    from sqlalchemy import and_, or_
    import models
    from datetime import datetime, timedelta

    # --- Rule 1: Max Advance Booking Window (30 Days) ---
    max_days = 30
    if booking_date > datetime.now().date() + timedelta(days=max_days):
        raise HTTPException(status_code=400, detail=f"Bookings can only be made up to {max_days} days in advance.")

    # --- Rule 2: Strict Past Time Check ---
    # Create full datetime objects for comparison
    booking_start_dt = datetime.combine(booking_date, start_time)
    
    # Allow a small buffer (e.g., 2 minutes) for network latency/clock skew
    if booking_start_dt < datetime.now() - timedelta(minutes=2):
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past.")

    # --- Rule 3: Max Duration Limit (4 Hours) ---
    max_duration = 240 # 4 hours
    if duration_minutes > max_duration:
        raise HTTPException(status_code=400, detail=f"Maximum booking duration is {max_duration // 60} hours.")

    # --- Rule 4: Double Booking Check (Court Concurrency) ---
    # Check if ANY existing booking for this court overlaps with requested time
    # Overlap Logic: (StartA < EndB) and (EndA > StartB)
    overlapping_booking = db.query(models.Booking).filter(
        models.Booking.court_id == court_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled',
        # New Overlap Logic using Time objects
        models.Booking._old_start_time < end_time,
        models.Booking._old_end_time > start_time
    ).first()

    if overlapping_booking:
        print(f"[VALIDATION] Double booking detected! Existing: {overlapping_booking.booking_display_id}")
        raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another time.")

    # --- Rule 5: User Overlap Check (prevent same user playing in 2 places) ---
    user_overlap = db.query(models.Booking).filter(
        models.Booking.user_id == user_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled',
        models.Booking._old_start_time < end_time,
        models.Booking._old_end_time > start_time
    ).first()

    if user_overlap:
        print(f"[VALIDATION] User overlap detected! Existing: {user_overlap.booking_display_id}")
        raise HTTPException(status_code=400, detail="You already have a booking overlapping with this time.")

def validate_court_configuration(db: Session, court_id: str, booking_date: datetime.date, requested_slots: list, expected_total_amount: float, number_of_players: int = 1):
    """
    Validate that the requested slots:
    1. Exist within the court's operating hours (Business Hours)
    2. Are not blocked by admin (Unavailability)
    3. Have the correct price (Price Tampering)
    """
    from fastapi import HTTPException
    from sqlalchemy import text
    from datetime import datetime, time, timedelta
    import json

    # 1. Fetch Court Config
    court_query = """
        SELECT
            ac.id,
            ac.price_per_hour,
            ac.price_conditions,
            ac.unavailability_slots
        FROM admin_courts ac
        WHERE ac.id = :court_id AND ac.is_active = true
    """
    result = db.execute(text(court_query), {"court_id": str(court_id)})
    court = result.fetchone()

    if not court:
        raise HTTPException(status_code=404, detail="Court not found or inactive")

    court_dict = dict(court._mapping)
    base_price = float(court_dict['price_per_hour'])
    timing_config = court_dict.get('price_conditions')
    unavailability_data = court_dict.get('unavailability_slots')

    import json
    def safe_json(val):
        if isinstance(val, str):
            try: return json.loads(val)
            except: return []
        return val or []

    timing_config = safe_json(timing_config)
    unavailability_data = safe_json(unavailability_data)

    # 2. Determine Valid Slots for this Date
    day_of_week = booking_date.strftime("%A").lower()[:3]
    date_str = booking_date.strftime("%Y-%m-%d")

    matching_configs = []
    # (Logic reused from courts.py for consistent slot generation)
    if isinstance(timing_config, list) and len(timing_config) > 0:
        date_specific = []
        day_specific = []
        for timing in timing_config:
            if isinstance(timing, dict):
                # Date Specific
                if 'dates' in timing and isinstance(timing.get('dates'), list):
                    if date_str in timing.get('dates', []):
                        date_specific.append(timing)
                # Day Specific
                elif 'days' in timing and isinstance(timing.get('days'), list):
                    days_list = [d.lower()[:3] for d in timing.get('days', [])]
                    if day_of_week in days_list:
                        day_specific.append(timing)
        
        # Prioritize Date > Day
        raw_configs = date_specific if date_specific else day_specific
        
        # Parse configs
        for cfg in raw_configs:
            try:
                msg = f"Parsing config: {cfg}" # debug
                s_h = int(cfg.get('slotFrom', '08:00').split(':')[0])
                e_h = int(cfg.get('slotTo', '22:00').split(':')[0])
                p = float(cfg.get('price', base_price))
                matching_configs.append({'start': s_h, 'end': e_h, 'price': p})
            except: pass

    # Default if no config matches
    if not matching_configs:
        # Default 6 AM to 11 PM (extended default) or 8-10? 
        # courts.py led to 8-22. Let's stick to 8-22 to be consistent if no config.
        # But actually, simpler: standard 24h or logic? 
        # Let's use 8-22 as fallback to match courts.py
        for h in range(8, 22):
            matching_configs.append({'start': h, 'end': h+1, 'price': base_price})

    # 3. Build Map of Allowed Hourly Slots (StartHour -> Price)
    # Using 'start_time' string as key to match requested slots easily
    allowed_slots_map = {} # "HH:MM" -> price
    
    # We need to map the configuration ranges to actual hourly slots
    # E.g. Config 10:00-12:00 @ 200 => Slots 10:00-11:00, 11:00-12:00
    for cfg in matching_configs:
        # If config is range, break into hourly slots
        # Note: courts.py creates SINGLE slot for the range now ? 
        # "Each configuration now creates a SINGLE slot" in courts.py comment line 298
        # Wait, if courts.py creates ONE slot 10-12, then the user MUST book 10-12?
        # Yes, standard Playo-like systems often define slots.
        # Let's support verifying the EXACT slot logic.
        
        # If courts.py generates "10:00"-"12:00", then requested slot MUST be "10:00"-"12:00"
        # validation should check if requested slot == an allowed slot.
        s_str = f"{cfg['start']:02d}:00"
        e_str = f"{cfg['end']:02d}:00"
        allowed_slots_map[s_str] = {
            'end_time': e_str,
            'price': cfg['price'],
            'is_blocked': False
        }

    # 4. Apply Unavailability (Block slots)
    # unavailability_slots structure: { "dates": [...], "times": ["10:00", "11:00"] }
    # Times refer to start_time of the slot.
    full_day_name = booking_date.strftime("%A") # Monday...
    for unavail in unavailability_data:
        if isinstance(unavail, dict):
            # Check Date/Day match
            is_match = False
            if 'dates' in unavail and date_str in unavail.get('dates', []):
                is_match = True
            if 'days' in unavail:
                days_cfg = [d.lower() for d in unavail.get('days', [])]
                if full_day_name.lower() in days_cfg:
                    is_match = True
            
            if is_match:
                blocked_times = unavail.get('times', [])
                for t in blocked_times:
                    if t in allowed_slots_map:
                        allowed_slots_map[t]['is_blocked'] = True

    # 5. Validate Each REQUESTED Slot
    calculated_total = 0.0
    
    for req in requested_slots:
        # req is dict { "start_time": "HH:MM", "end_time": "HH:MM", "price": ... }
        r_start = req['start_time']
        
        # Check integrity
        if r_start not in allowed_slots_map:
            raise HTTPException(status_code=400, detail=f"Slot starting at {r_start} is not available/valid for this court on this date.")
        
        server_slot = allowed_slots_map[r_start]
        
        # Check 'Admin Unavailability'
        if server_slot['is_blocked']:
             raise HTTPException(status_code=400, detail=f"Slot at {r_start} is currently unavailable (Blocked by Admin).")
            
        # Check 'Price Tampering'
        # Allow small diff?
        expected_price = float(server_slot['price'])
        provided_price = float(req.get('price', 0))
        
        if abs(expected_price - provided_price) > 1.0: # 1 rupee tolerance
             print(f"[PRICE CHECK FAIL] Slot {r_start}: Expected {expected_price}, Got {provided_price}")
             # fail or warn? STRICT for now
             raise HTTPException(status_code=400, detail=f"Price mismatch for slot {r_start}. Please refresh and try again.")
             
        calculated_total += expected_price

    # 6. Validate Total Amount
    # If booking.original_amount is sent, it should match sum of slots * players + platform fee
    # Total Amount = Original - Discount. We validate original here.
    
    # Apply Player Multiplier
    calculated_subtotal = calculated_total * number_of_players
    
    # Apply Platform Fee (Fixed 20 for now)
    PLATFORM_FEE = 20.0
    calculated_final_total = calculated_subtotal + PLATFORM_FEE

    # Log for debug
    print(f"[VALIDATION] Price Check: Server Calc={calculated_final_total} (Slots={calculated_total} * P={number_of_players} + Fee={PLATFORM_FEE}) vs Expected={expected_total_amount}")

    if abs(calculated_final_total - float(expected_total_amount)) > 5.0:
         print(f"[VALIDATION FAIL] Mismatch! Server: {calculated_final_total}, Client: {expected_total_amount}")
         raise HTTPException(status_code=400, detail=f"Total booking amount mismatch. Server calculated: {calculated_final_total}, You sent: {expected_total_amount}")

    print("[VALIDATION] Configuration & Price Check passed.")


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
        
        # New Booking ID
        new_display_id = generate_booking_display_id()

        def parse_time_str(time_str):
            time_str = str(time_str).strip()
            if re.match(r'^\d{1,2}:\d{2}$', time_str):
                 return dt.strptime(time_str, '%H:%M').time()
            match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?', time_str)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                ampm = match.group(3)
                if ampm and ampm.upper() == 'PM' and hour != 12:
                    hour += 12
                elif ampm and ampm.upper() == 'AM' and hour == 12:
                    hour = 0
                return time(hour, minute)
            return time(10, 0) # Fallback

        # Check if multi-slot data is provided (New Flow)
        if booking.time_slots and len(booking.time_slots) > 0:
            print(f"[CRUD BOOKING] Processing multi-slot booking with {len(booking.time_slots)} slots")
            
            sanitized_slots = []
            for slot in booking.time_slots:
                raw_time = slot.get('time') or slot.get('start_time')
                price = slot.get('price')
                
                # Parse start time
                s_time = parse_time_str(raw_time)
                
                # Calculate end time (assume 60 mins if not provided)
                # If end_time provided, parse it, else add 60 mins
                raw_end = slot.get('end_time')
                if raw_end:
                     e_time = parse_time_str(raw_end)
                else:
                     # Add 60 mins
                     dummy_date = dt.combine(dt.today(), s_time)
                     e_date = dummy_date + timedelta(minutes=60)
                     e_time = e_date.time()
                
                sanitized_slots.append({
                    "start_time": s_time.strftime("%H:%M"),
                    "end_time": e_time.strftime("%H:%M"),
                    "price": price,
                    "display_time": slot.get('display_time') or f"{s_time.strftime('%I:%M %p')} - {e_time.strftime('%I:%M %p')}"
                })
            
            time_slots = sanitized_slots
            # Assume 60 mins per slot for now if not specified
            total_duration = len(time_slots) * 60 
            
            # Get first slot for legacy compatibility
            if len(time_slots) > 0:
                start_time_val = dt.strptime(time_slots[0]['start_time'], '%H:%M').time()
                # End time of LAST slot? or first slot? 
                # Legacy implies booking is one block. If multi-slots are 10-11, 11-12, total is 10-12.
                # Let's set start of first, end of last?
                # Actually legacy start/end usually means the whole block.
                # But let's stick to simple: start of first.
                # End time? 
                end_time_val = dt.strptime(time_slots[-1]['end_time'], '%H:%M').time()
            else:
                 # Should not happen
                 start_time_val = time(10, 0)
                 end_time_val = time(11, 0)

        else:
            # Legacy Flow (Single Slot)
            print("[CRUD BOOKING] Processing legacy single-slot booking")
            time_str = str(booking.start_time).strip()
            
            start_dt = parse_time_str(time_str)
            start_datetime = dt.combine(booking.booking_date, start_dt)
            end_dt_result = start_datetime + timedelta(minutes=booking.duration_minutes)
            end_time_obj = end_dt_result.time()
            
            start_time_val = start_dt
            end_time_val = end_time_obj
            total_duration = booking.duration_minutes
            
            # Create single slot for time_slots array
            time_slots = [{
                "start_time": start_dt.strftime("%H:%M"),
                "end_time": end_time_obj.strftime("%H:%M"),
                "price": booking.price_per_hour,
                "display_time": f"{start_dt.strftime('%I:%M %p')} - {end_time_obj.strftime('%I:%M %p')}"
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
            number_of_players = booking.number_of_players or 2
            
            # Legacy expected total_amount (often calculated as hourly_price * players * hours)
            # BUT usually price_per_hour FROM FRONTEND is already slot price? No, it's usually rate.
            # Let's check how it was: total_amount = price_per_hour * (booking.duration_minutes / 60.0) * number_of_players
            
            calculated_total = price_per_hour * (booking.duration_minutes / 60.0) * number_of_players
            original_amount = calculated_total # Assuming no discount unless coupon passed separately?
            discount_amount = 0
        
        # Determine final total amount to store
        # In legacy, there wasn't a separate 'total_amount' field in BookingCreate, it was calculated.
        # So we use the calculated one.
        total_amount = float(original_amount) - float(discount_amount)

        # 3. Verify Court & User
        from sqlalchemy import text
        court_check = db.execute(
            text("SELECT id FROM admin_courts WHERE id = :court_id"),
            {"court_id": str(booking.court_id)}
        ).fetchone()
        
        if not court_check:
            raise ValueError(f"Court {booking.court_id} not found in admin_courts table")
            
        from uuid import UUID
        c_uuid = UUID(str(booking.court_id))

        # --- VALIDATE BOOKING RULES (Double Booking, etc.) ---
        # Run strict validation before proceeding
        validate_booking_rules(
            db=db,
            user_id=user_id,
            court_id=c_uuid, # Pass as UUID to match model
            booking_date=booking.booking_date,
            start_time=start_time_val,
            end_time=end_time_val,
            duration_minutes=total_duration
        )

        # --- VALIDATE CONFIGURATION (Business Hours, Admin Blocks, Price) ---
        validate_court_configuration(
            db=db,
            court_id=str(c_uuid),
            booking_date=booking.booking_date,
            requested_slots=time_slots,
            expected_total_amount=original_amount,
            number_of_players=booking.number_of_players or 2
        )
        
        user_exists = db.query(models.User).filter(models.User.id == user_id).first()
        if not user_exists:
            raise ValueError(f"User {user_id} not found")

        # 4. Create Booking
        booking_data = {
            "user_id": user_id,
            "court_id": str(c_uuid),
            "booking_date": booking.booking_date,
            "booking_display_id": new_display_id,
            
            # New Columns
            "time_slots": time_slots,
            "total_duration_minutes": total_duration,
            "original_amount": original_amount,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "coupon_code": booking.coupon_code,
            
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
            "status": "confirmed",
            "payment_status": booking.payment_status or "pending",
            "payment_id": booking.razorpay_payment_id,
            "razorpay_order_id": booking.razorpay_order_id,
            "razorpay_signature": booking.razorpay_signature,
        }

        print(f"[CRUD BOOKING] Creating booking with data: {booking_data}")

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

def get_bookings(db: Session, user_id: str):
    """Get all bookings for a user"""
    try:
        print(f"[CRUD] Getting bookings for user: {user_id}")
        
        # Use ORM directly now that models are safer
        from sqlalchemy import desc
        bookings = db.query(models.Booking)\
            .filter(models.Booking.user_id == user_id)\
            .order_by(desc(models.Booking.booking_date), desc(models.Booking.start_time))\
            .all()
            
        print(f"[CRUD] Found {len(bookings)} bookings")
        return bookings

    except Exception as e:
        print(f"[CRUD] Critical error getting bookings for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        # Final fallback - return empty list to prevent app crash
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
