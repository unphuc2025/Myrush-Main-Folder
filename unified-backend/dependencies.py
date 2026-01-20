"""
Authentication and authorization dependencies for unified backend
Handles both admin (simple token) and user (JWT) authentication
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Annotated, Optional, List
import os
from dotenv import load_dotenv
import models
from database import get_db

load_dotenv()

# JWT Configuration for User Auth
SECRET_KEY = "myrush_hardcoded_secret_key_2026"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 24 * 60))  # 24 hours

# OAuth2 scheme for user authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/user/auth/login")

# ============================================================================
# USER AUTHENTICATION (JWT)
# ============================================================================

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    db: Session = Depends(get_db)
) -> models.User:
    """
    Validate JWT token and return current user
    Used for all user-facing endpoints
    """
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
            
    except JWTError:
        raise credentials_exception
    
    # Check if sub is an email (contains @)
    user = None
    if "@" in sub:
        # Try finding by email
        user = db.query(models.User).filter(models.User.email == sub).first()
    
    # If not found or not email, try by ID
    if user is None:
        # Validate if it looks like a valid UUID? 
        # Actually sqlalchemy will handle string comparison safely usually, 
        # but if sub is email and we check id==email, it might error if ID is UUID type
        try:
            if "@" not in sub: # Only check ID if it doesn't look like email
                user = db.query(models.User).filter(models.User.id == sub).first()
        except Exception:
            pass # ID format mismatch
            
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

# ============================================================================
# ADMIN AUTHENTICATION (Simple Token)
# ============================================================================

def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.Admin:
    """
    Validate admin token and return current admin
    Used for all admin-facing endpoints
    
    Note: Currently uses simple token format: "admin-token-{admin_id}"
    In production, consider using JWT for admins as well
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Simple token validation: "admin-token-{admin_id}"
    if not token.startswith("admin-token-"):
        raise credentials_exception
    
    try:
        admin_id = token.replace("admin-token-", "")
        admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
        
        if admin is None:
            raise credentials_exception
        
        return admin
        
    except Exception:
        raise credentials_exception

# ============================================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================================

def require_super_admin(
    admin: Annotated[models.Admin, Depends(get_current_admin)]
) -> models.Admin:
    """
    Require super admin role
    Use this dependency for endpoints that only super admins can access
    """
    if admin.role != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return admin

def require_branch_admin(
    admin: Annotated[models.Admin, Depends(get_current_admin)]
) -> models.Admin:
    """
    Require branch admin role (or super admin)
    Use this dependency for endpoints that branch admins can access
    """
    if admin.role not in ['super_admin', 'branch_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return admin

def get_admin_branch_filter(
    admin: Annotated[models.Admin, Depends(get_current_admin)]
) -> Optional[List[str]]:
    """
    Get branch filter for admin
    - Super admins can see all branches (returns None)
    - Branch admins can only see their assigned branches (returns list of UUID strings)
    """
    if admin.role == 'super_admin':
        return None  # No filter, can see all
    
    # Collect all accessible branches
    branch_ids = set()
    
    # M2M branches
    if admin.accessible_branches:
        branch_ids.update(str(b.id) for b in admin.accessible_branches)
        
    # Legacy single branch (fallback)
    if admin.branch_id:
        branch_ids.add(str(admin.branch_id))
        
    if not branch_ids:
         # Strict: if not super admin and no branches, return empty list (see nothing)?
         # Or error? Let's return empty list so filters return 0 results.
         return []

    return list(branch_ids)

# ============================================================================
# OPTIONAL AUTHENTICATION (for public endpoints)
# ============================================================================

def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Optional user authentication
    Returns user if token is valid, None otherwise
    Useful for endpoints that work both authenticated and unauthenticated
    """
    try:
        return get_current_user(token, db)
    except HTTPException:
        return None
