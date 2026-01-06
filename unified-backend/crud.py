from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func, text
import models, schemas
from passlib.context import CryptContext
import uuid
from datetime import timedelta, datetime
import random
from sqlalchemy import and_

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

def create_user_with_phone(db: Session, phone_number: str, profile_data: dict | None = None):
    """Create a user record for a phone-based user and store profile data.

    `profile_data` may contain keys matching Profile fields and will be stored.
    """
    user_id = str(uuid.uuid4())
    # Use a very simple, short password for phone-based users
    # They login via OTP, never use password
    temp_password = "phone_user_temp"  # Short and simple
    
    db_user = models.User(
        id=user_id,
        email=f"{phone_number}@phone.myrush.app",
        password_hash=get_password_hash(temp_password),
        first_name=(profile_data.get("full_name") if profile_data and profile_data.get("full_name") else ""),
        last_name="",
        phone_number=phone_number
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
    db_profile = get_profile(db, user_id)
    if db_profile:
        for key, value in profile.dict(exclude_unset=True).items():
            setattr(db_profile, key, value)
    else:
        db_profile = models.Profile(**profile.dict(), id=user_id)
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

def create_booking(db: Session, booking: schemas.BookingCreate, user_id: str):
    try:
        print(f"[CRUD BOOKING] Starting booking creation for user: {user_id}")

        # Parse time from AM/PM format to 24-hour format
        import re
        time_str = str(booking.start_time).strip()
        print(f"[CRUD BOOKING] Parsing time: {time_str}")

        # If already in HH:MM format, use as is
        if re.match(r'^\d{1,2}:\d{2}$', time_str):
            start_time_str = time_str
        else:
            # Handle AM/PM format
            match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?', time_str)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                ampm = match.group(3)

                if ampm and ampm.upper() == 'PM' and hour != 12:
                    hour += 12
                elif ampm and ampm.upper() == 'AM' and hour == 12:
                    hour = 0

                start_time_str = f"{hour:02d}:{minute:02d}"
            else:
                start_time_str = "10:00"  # Default fallback

        print(f"[CRUD BOOKING] Parsed time to: {start_time_str}")

        # Calculate end_time using string time
        from datetime import datetime as dt
        start_dt = dt.strptime(start_time_str, '%H:%M').time()
        start_datetime = dt.combine(booking.booking_date, start_dt)
        end_dt = start_datetime + timedelta(minutes=booking.duration_minutes)
        end_time = end_dt.time()

        price_per_hour = booking.price_per_hour or 200.0 # Use selected price or default
        number_of_players = booking.number_of_players or 2
        total_amount = price_per_hour * (booking.duration_minutes / 60.0) * number_of_players

        print(f"[CRUD BOOKING] Calculations: price_per_hour={price_per_hour}, duration_minutes={booking.duration_minutes}, number_of_players={number_of_players}, total_amount={total_amount}")

        # Check if court exists in admin_courts table
        from sqlalchemy import text
        court_check = db.execute(
            text("SELECT id FROM admin_courts WHERE id = :court_id"),
            {"court_id": str(booking.court_id)}
        ).fetchone()
        
        if not court_check:
            print(f"[CRUD BOOKING] ERROR: Court {booking.court_id} does not exist in admin_courts")
            raise ValueError(f"Court {booking.court_id} not found in admin_courts table")
        
        print(f"[CRUD BOOKING] ✅ Court {booking.court_id} found in admin_courts")

        try:
            from uuid import UUID
            try:
                # Validate UUIDs
                c_uuid = UUID(str(booking.court_id))
            except ValueError:
                 raise ValueError("Invalid Court ID format")

            # Check if user exists
            user_exists = db.query(models.User).filter(models.User.id == user_id).first()
            if not user_exists:
                print(f"[CRUD BOOKING] ERROR: User {user_id} does not exist")
                raise ValueError(f"User {user_id} not found")
            
            # Check if court exists
            court_exists = db.query(models.Court).filter(models.Court.id == str(c_uuid)).first()
            if not court_exists:
                raise ValueError(f"Court {booking.court_id} not found")

            # Don't set id - let PostgreSQL generate it with uuid_generate_v4()
            booking_data = {
                "user_id": user_id,
                "court_id": str(c_uuid),  # Changed from venue_id to court_id
                "booking_date": booking.booking_date,
                "start_time": booking.start_time,
                "end_time": end_time,
                "duration_minutes": booking.duration_minutes,
                "number_of_players": number_of_players,
                "team_name": booking.team_name,
                "special_requests": booking.special_requests,
                "price_per_hour": price_per_hour,
                "original_price_per_hour": booking.original_price_per_hour,
                "total_amount": total_amount,
                # Mark booking as confirmed immediately on successful creation.
                # Payment can still be tracked separately via payment_status.
                "status": "confirmed",
                "payment_status": "pending"
            }

            # Adjust data types for MySQL compatibility
            adjusted_booking_data = {
                **booking_data,
                'start_time': start_dt,  # Use the parsed start TIME object
                'end_time': end_time,    # end_time is already TIME object
                'booking_date': booking.booking_date,  # Ensure date format
            }

            print(f"[CRUD BOOKING] Creating booking with adjusted data: {adjusted_booking_data}")

            db_booking = models.Booking(**adjusted_booking_data)
            db.add(db_booking)

            print("[CRUD BOOKING] Committing to database...")
            db.commit()

            print(f"[CRUD BOOKING] Refreshing booking data for ID: {db_booking.id}")
            db.refresh(db_booking)

            print(f"[CRUD BOOKING] SUCCESS: Booking created with ID: {db_booking.id}, total_amount: {db_booking.total_amount}")
            return db_booking

        except ValueError as ve:
             # Re-raise value errors (validation)
             raise ve
        except Exception as e:
            # Handle integrity error wrapper
            if "foreign key constraint" in str(e).lower():
                 print(f"[CRUD BOOKING] Foreign Key Error: {e}")
                 # Try to identify which FK
                 if "court_id" in str(e).lower():
                      raise ValueError("Court not found (FK Error)")
            print(f"[CRUD BOOKING] ERROR: Exception during booking creation: {e}")
            import traceback
            traceback.print_exc()
            raise e

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

# Push Token CRUD Functions
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
