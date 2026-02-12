from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from typing import Annotated, Optional
import schemas, crud, models, database
from jose import JWTError, jwt
import os
from datetime import timedelta, datetime
import uuid
import random

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

SECRET_KEY = "myrush_hardcoded_secret_key_2026"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 24 * 60))  # 24 hours for development

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
        # token sub may be email or user id
        token_data = schemas.TokenData(email=sub if "@" in sub else None)
    except JWTError:
        raise credentials_exception
    user = None
    if token_data.email:
        user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        # try by id
        try:
            # Check if sub is a valid UUID before querying to avoid DB errors
            user_id = uuid.UUID(payload.get("sub"))
            user = db.query(models.User).filter(models.User.id == user_id).first()
        except (ValueError, TypeError):
            # sub is not a valid UUID, so it can't match a UUID column
            pass
            
    if user is None:
        raise credentials_exception
    return user


@router.post("/send-otp", response_model=schemas.SendOTPResponse)
def send_otp(payload: schemas.SendOTPRequest):
    print(f"[SEND-OTP] Request for {payload.phone_number}", flush=True)
    
    # Use dummy OTP for development
    otp_code = "12345"
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Try to store in database, but don't fail if DB is down
    try:
        db = database.SessionLocal()
        print(f"[SEND-OTP] Creating OTP record in database...", flush=True)
        otp = crud.create_otp_record(db, payload.phone_number, otp_code, expires_at)
        db.close()
        print(f"[DEV] OTP for {payload.phone_number}: {otp_code} (id={otp.id})", flush=True)
        return {"message": "OTP sent successfully", "success": True, "verification_id": str(otp.id), "otp_code": otp_code}
    except Exception as db_err:
        # Database error - provide response anyway with dev OTP
        print(f"[SEND-OTP] DB Error: {type(db_err).__name__}: {str(db_err)}", flush=True)
        print(f"[SEND-OTP] Continuing in dev mode without database...", flush=True)
        print(f"[DEV] OTP for {payload.phone_number}: {otp_code} (dev mode, no db)", flush=True)
        # Return success response even without DB - this allows development to continue
        return {"message": "OTP sent successfully (dev mode - DB unavailable)", "success": True, "verification_id": "dev-mode", "otp_code": otp_code}


@router.post("/verify-otp")
def verify_otp(payload: schemas.VerifyOTPRequest):
    """Verify OTP for phone-based login.

    This is used only for mobile phone+OTP login. In development, the
    fixed OTP "12345" is always accepted, even if the database is down.
    """
    try:
        print(f"[VERIFY-OTP] Request: phone={payload.phone_number}, otp={payload.otp_code}")
        db = database.SessionLocal()

        try:
            # Development bypass: accept fixed OTP '12345' even if no DB record exists
            otp = None
            try:
                if payload.otp_code == "12345":
                    # Try to find an existing otp record and mark it verified, otherwise proceed
                    existing = (
                        db.query(models.OtpVerification)
                        .filter(models.OtpVerification.phone_number == payload.phone_number)
                        .order_by(models.OtpVerification.created_at.desc())
                        .first()
                    )
                    if existing:
                        existing.is_verified = True
                        db.commit()
                        db.refresh(existing)
                        otp = existing
                    else:
                        # No DB record but OTP bypassed for dev - treat as verified
                        otp = True
                else:
                    otp = crud.verify_otp_record(db, payload.phone_number, payload.otp_code)
            except Exception as db_err:
                print(f"[VERIFY-OTP] Database error when verifying OTP: {db_err}")
                # In dev mode, still accept the fixed OTP even if DB is down
                if payload.otp_code == "12345":
                    print("[VERIFY-OTP] Accepting dev OTP despite DB error")
                    otp = True
                else:
                    raise

            if not otp:
                print("[VERIFY-OTP] Invalid OTP")
                raise HTTPException(status_code=400, detail="Invalid or expired OTP")

            print("[VERIFY-OTP] OTP verified, checking for existing user...")

            try:
                user = crud.get_user_by_phone(db, payload.phone_number)
                is_new_user = False
            except Exception as db_err:
                print(f"[VERIFY-OTP] Database error checking user: {db_err}")
                user = None
                is_new_user = True

            if user is None:
                is_new_user = True

            print(f"[VERIFY-OTP] User found: {user is not None}, is_new_user: {is_new_user}")

            # If new user and no profile data, ask frontend to show profile form
            has_profile_data = payload.full_name is not None
            if is_new_user and not has_profile_data:
                print("[VERIFY-OTP] New user needs to complete profile")
                db.close()
                return {
                    "needs_profile": True,
                    "phone_number": payload.phone_number,
                    "message": "Please complete your profile",
                }

            # Optional profile data
            profile_payload = {
                "full_name": payload.full_name,
                "age": payload.age,
                "city": payload.city,
                "gender": payload.gender,
                "handedness": payload.handedness,
                "skill_level": payload.skill_level,
                "sports": payload.sports,
                "playing_style": payload.playing_style,
            }
            profile_payload = {k: v for k, v in profile_payload.items() if v is not None}
            print(f"[VERIFY-OTP] Profile payload: {profile_payload}")

            # Create or update user + profile
            try:
                if not user:
                    print("[VERIFY-OTP] Creating new user...")
                    user = crud.create_user_with_phone(
                        db,
                        payload.phone_number,
                        profile_payload if profile_payload else None,
                    )
                    print(f"[VERIFY-OTP] User created: {user.id}")
                else:
                    print(f"[VERIFY-OTP] Updating existing user: {user.id}")
                    if profile_payload:
                        allowed_fields = [
                            "phone_number",
                            "full_name",
                            "age",
                            "city",
                            "gender",
                            "handedness",
                            "skill_level",
                            "sports",
                            "playing_style",
                        ]
                        profile_create_data = {
                            k: v for k, v in profile_payload.items() if k in allowed_fields
                        }
                        profile_create_data["phone_number"] = payload.phone_number
                        crud.create_or_update_profile(
                            db, schemas.ProfileCreate(**profile_create_data), user.id
                        )
            except Exception as db_err:
                print(f"[VERIFY-OTP] CRITICAL Database error creating/updating user: {db_err}")
                import traceback
                traceback.print_exc()
                # Do NOT swallow error. Fail loudly so client knows registration failed.
                raise HTTPException(
                    status_code=500,
                    detail=f"Database error during registration: {str(db_err)}"
                )

            # Ensure we always have a valid *string* subject for the JWT token.
            # Some users may have NULL email and a UUID object as id.
            raw_sub = getattr(user, "email", None) or getattr(user, "id", None)
            if raw_sub is None:
                raise HTTPException(
                    status_code=500,
                    detail="Cannot generate auth token: user has no email or id",
                )
            sub_value = str(raw_sub)
            print(
                "[VERIFY-OTP] Generating token. "
                f"email={getattr(user, 'email', None)}, "
                f"id={getattr(user, 'id', None)}, "
                f"sub={sub_value} (type={type(raw_sub)})",
            )

            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": sub_value}, expires_delta=access_token_expires
            )

            db.close()
            print("[VERIFY-OTP] Success! Token generated")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "is_new_user": is_new_user,
            }
        except HTTPException:
            db.close()
            raise
        except Exception as e:
            db.close()
            print(f"[VERIFY-OTP] ERROR: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500, detail=f"Internal server error: {e}"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[VERIFY-OTP] OUTER ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {e}"
        )

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=schemas.Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile", response_model=schemas.User)
def read_users_me(current_user: Annotated[models.User, Depends(get_current_user)]):
    return current_user
