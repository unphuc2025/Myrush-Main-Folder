from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
import uuid
from datetime import datetime, timedelta
import random

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

from utils.email_sender import send_admin_credentials_email

# ============= USERS =============

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """Get all users"""
    return db.query(models.User).all()

@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users")
def create_user(user: dict, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = models.User(
        **user
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}")
def update_user(user_id: str, user: dict, db: Session = Depends(get_db)):
    """Update a user"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user.items():
        if hasattr(db_user, key):
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# ============= PROFILES =============

@router.get("/profiles")
def get_all_profiles(db: Session = Depends(get_db)):
    """Get all profiles"""
    return db.query(models.Profile).all()

@router.get("/profiles/{profile_id}")
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    """Get a specific profile by ID"""
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# ============= OTP VERIFICATION =============

@router.post("/otp/send")
def send_otp(phone_number: str, country_code: str = "+91", db: Session = Depends(get_db)):
    """Generate and send OTP"""
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Delete any existing OTP for this phone number
    db.query(models.OtpVerification).filter(
        models.OtpVerification.phone_number == phone_number
    ).delete()
    
    # Create new OTP record
    db_otp = models.OtpVerification(
        phone_number=phone_number,
        country_code=country_code,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(db_otp)
    db.commit()
    
    return {
        "message": "OTP sent successfully",
        "otp": otp_code,  # In production, don't return OTP - send via SMS
        "expires_in": "10 minutes"
    }

@router.post("/otp/verify")
def verify_otp(phone_number: str, otp_code: str, db: Session = Depends(get_db)):
    """Verify OTP"""
    otp_record = db.query(models.OtpVerification).filter(
        models.OtpVerification.phone_number == phone_number,
        models.OtpVerification.otp_code == otp_code,
        models.OtpVerification.is_verified == False
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if otp_record.attempts >= otp_record.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts exceeded")
    
    # Mark as verified
    otp_record.is_verified = True
    otp_record.verified_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "OTP verified successfully",
        "verified": True
    }

# ============= ADMINS =============

@router.get("/admins", response_model=List[schemas.Admin])
def get_all_admins(db: Session = Depends(get_db)):
    """Get all admins"""
    return db.query(models.Admin).all()

@router.post("/admins", response_model=schemas.Admin)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    """Create a new admin (Super or Branch)"""
    # Check if mobile already exists
    existing_admin = db.query(models.Admin).filter(models.Admin.mobile == admin.mobile).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    # Check if email is provided and already exists
    if admin.email:
        existing_email = db.query(models.Admin).filter(models.Admin.email == admin.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    db_admin = models.Admin(
        name=admin.name,
        mobile=admin.mobile,
        email=admin.email,
        password_hash=admin.password, # In production, hash this!
        role=admin.role,
        branch_id=admin.branch_id if admin.role == 'branch_admin' else None,
        must_change_password=True  # Force password change
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)

    # Send credentials email
    if admin.email:
        send_admin_credentials_email(admin.email, admin.name, admin.mobile, admin.password)

    return db_admin

@router.post("/admins/login")
def admin_login(login_data: schemas.AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin login"""
    mobile = login_data.mobile
    password = login_data.password
    
    admin = db.query(models.Admin).filter(models.Admin.mobile == mobile).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Simple password check (plaintext for dev/demo as per existing pattern)
    if admin.password_hash != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "message": "Login successful",
        "token": f"admin-token-{admin.id}", # Simple token for now
        "admin": {
            "id": str(admin.id),
            "name": admin.name,
            "mobile": admin.mobile,
            "role": admin.role,
            "branch_id": str(admin.branch_id) if admin.branch_id else None,
            "must_change_password": admin.must_change_password
        }
    }
