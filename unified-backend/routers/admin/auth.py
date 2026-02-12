from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
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
from dependencies import PermissionChecker

# ============= USERS =============

@router.get("/users", response_model=schemas.UserListResponse, dependencies=[Depends(PermissionChecker("User Management", "view"))])
def get_all_users(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db)
    # TODO: Add admin dependency after verifying frontend
):
    """Get all users with pagination and search"""
    today_date = datetime.utcnow().date()
    # Eager load profile to ensure we get names if they are only in profile
    from sqlalchemy.orm import joinedload
    query = db.query(models.User).options(joinedload(models.User.profile))
    
    if search:
        search_filter = f"%{search}%"
        query = query.join(models.Profile, isouter=True).filter(
            or_(
                models.User.first_name.ilike(search_filter),
                models.User.last_name.ilike(search_filter),
                models.User.email.ilike(search_filter),
                models.User.phone_number.ilike(search_filter),
                models.User.full_name.ilike(search_filter),
                # Also search in profile fields
                models.Profile.full_name.ilike(search_filter),
                models.Profile.phone_number.ilike(search_filter)
            )
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "items": users,
        "total": total,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/users/{user_id}", dependencies=[Depends(PermissionChecker("User Management", "view"))])
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", dependencies=[Depends(PermissionChecker("User Management", "add"))])
def create_user(user: dict, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = models.User(
        **user
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}", dependencies=[Depends(PermissionChecker("User Management", "edit"))])
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

from dependencies import require_super_admin, get_current_admin

@router.get("/admins", response_model=List[schemas.Admin], dependencies=[Depends(PermissionChecker("Sub Admin Management", "view"))])
def get_all_admins(db: Session = Depends(get_db)):
    """Get all admins"""
    return db.query(models.Admin).all()

@router.post("/admins", response_model=schemas.Admin, dependencies=[Depends(PermissionChecker("Sub Admin Management", "add"))])
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    """Create a new admin (Super or Branch)"""
    # Check if mobile already exists
    existing_admin = db.query(models.Admin).filter(models.Admin.mobile == admin.mobile).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Mobile number already registered. Please enter a new number.")

    # Check if email is provided and already exists
    if admin.email:
        existing_email = db.query(models.Admin).filter(models.Admin.email == admin.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Check if role_id is valid
    if admin.role_id:
        role = db.query(models.Role).filter(models.Role.id == admin.role_id).first()
        if not role:
             raise HTTPException(status_code=400, detail="Invalid role selected")

    # If role_id is provided, force role to 'admin' to ensure permissions are checked
    # The 'super_admin' role bypasses all checks, so we must not use it for role-based admins
    final_role = admin.role
    if admin.role_id:
        final_role = 'admin'
        
    db_admin = models.Admin(
        name=admin.name,
        mobile=admin.mobile,
        email=admin.email,
        password_hash=admin.password, # In production, hash this!
        role=final_role,
        role_id=admin.role_id,
        # Legacy support: if single branch_id passed, use it, though data isolation uses M2M
        branch_id=admin.branch_id if admin.branch_id and admin.role != 'super_admin' else None, 
        must_change_password=True  # Force password change
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)

    # Handle Multi-Branch Assignment
    # If branch_ids passed, add to M2M table
    # Also support legacy branch_id -> add to M2M
    branches_to_add = set()
    if admin.branch_ids:
        for bid in admin.branch_ids:
            branches_to_add.add(bid)
    if admin.branch_id and admin.role != 'super_admin':
         branches_to_add.add(admin.branch_id)
    
    if branches_to_add and admin.role != 'super_admin':
        for bid in branches_to_add:
            access = models.AdminBranchAccess(admin_id=db_admin.id, branch_id=bid)
            db.add(access)
        db.commit()
        db.refresh(db_admin) # re-fetch relationships

    # Send credentials email
    if admin.email:
        send_admin_credentials_email(admin.email, admin.name, admin.mobile, admin.password)

    return db_admin

@router.put("/admins/{admin_id}", response_model=schemas.Admin)
def update_admin(
    admin_id: str, 
    admin_update: schemas.AdminUpdate, 
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """Update an admin"""
    # Permission Logic: Allow Self OR "Sub Admin Management" Edit
    is_self = str(current_admin.id) == admin_id
    has_permission = False
    
    if current_admin.role == 'super_admin':
        has_permission = True
    elif current_admin.role_rel and current_admin.role_rel.permissions:
         perms = current_admin.role_rel.permissions.get("Sub Admin Management")
         if perms and perms.get("edit"):
             has_permission = True
    
    if not is_self and not has_permission:
        raise HTTPException(status_code=403, detail="You don't have access")

    db_admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Check if mobile exists for other users
    if admin_update.mobile and admin_update.mobile != db_admin.mobile:
        existing = db.query(models.Admin).filter(models.Admin.mobile == admin_update.mobile).first()
        if existing:
            raise HTTPException(status_code=400, detail="Mobile number already registered. Please enter a new number.")
        db_admin.mobile = admin_update.mobile.strip()

    # Check email
    if admin_update.email and admin_update.email != db_admin.email:
        existing = db.query(models.Admin).filter(models.Admin.email == admin_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        db_admin.email = admin_update.email

    if admin_update.name:
        db_admin.name = admin_update.name
    
    # RESTRICT SENSITIVE FIELDS FOR NON-SUPER ADMINS
    if current_admin.role == 'super_admin':
        if admin_update.role:
            db_admin.role = admin_update.role
        if admin_update.role_id:
            db_admin.role_id = admin_update.role_id
            # Safety: If assigning specific role_id, ensure role is NOT super_admin
            if admin_update.role_id:
                db_admin.role = 'admin'
        
        # Handle Branches Update (Only allow super admin to change access)
        should_update_branches = False
        new_branches = set()
        
        if admin_update.branch_ids is not None:
            should_update_branches = True
            for bid in admin_update.branch_ids:
                new_branches.add(bid)
                
        # Legacy branch_id updates
        if admin_update.branch_id is not None:
            db_admin.branch_id = admin_update.branch_id if admin_update.role == 'branch_admin' else None
            if admin_update.role == 'branch_admin':
                new_branches.add(admin_update.branch_id)
                should_update_branches = True
                
        if should_update_branches:
            # Clear existing
            db.query(models.AdminBranchAccess).filter(models.AdminBranchAccess.admin_id == admin_id).delete()
            # Add new
            if admin_update.role != 'super_admin': 
                for bid in new_branches:
                    if bid:
                        db.add(models.AdminBranchAccess(admin_id=admin_id, branch_id=bid))
    
    elif admin_update.role or admin_update.role_id or admin_update.branch_ids or admin_update.branch_id:
        # If user tries to update restricted fields, we could raise error or just ignore. 
        # Raising error is safer to signal invalid attempt.
        # However, frontend might send current values which are harmless.
        # Let's just ignore them implies we trust frontend not to lie? No.
        # Secure approach: silently ignore or verify they match current.
        # Simpler: Just don't update them (as done by implicit else block skipping them).
        pass

    if admin_update.password:
        db_admin.password_hash = admin_update.password
        db_admin.must_change_password = False # Password changed, clear flag

    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.delete("/admins/{admin_id}", dependencies=[Depends(PermissionChecker("Sub Admin Management", "delete"))])
def delete_admin(admin_id: str, db: Session = Depends(get_db)):
    """Delete an admin"""
    db_admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    db.delete(db_admin)
    db.commit()
    return {"message": "Admin deleted successfully"}

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
    
    # Determine accessible branch IDs
    accessible_branches = []
    if admin.accessible_branches:
        accessible_branches = [str(b.id) for b in admin.accessible_branches]
    elif admin.branch_id: # Fallback
         accessible_branches = [str(admin.branch_id)]

    return {
        "success": True,
        "message": "Login successful",
        "token": f"admin-token-{admin.id}", # Simple token for now
        "admin": {
            "id": str(admin.id),
            "name": admin.name,
            "mobile": admin.mobile,
            "role": admin.role,
            "role_id": str(admin.role_id) if admin.role_id else None,
            "permissions": admin.role_rel.permissions if admin.role_rel else {},
            "branch_id": str(admin.branch_id) if admin.branch_id else None, # Legacy
            "branch_ids": accessible_branches, # New List
            "must_change_password": admin.must_change_password
        }
    }
