from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import models, schemas
from database import get_db
from dependencies import PermissionChecker

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("", response_model=schemas.UserListResponse, dependencies=[Depends(PermissionChecker("User Management", "view"))])
@router.get("/", response_model=schemas.UserListResponse, dependencies=[Depends(PermissionChecker("User Management", "view"))])
def get_all_users(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Get all users with pagination and search"""
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

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker("User Management", "view"))])
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=schemas.User, dependencies=[Depends(PermissionChecker("User Management", "add"))])
@router.post("/", response_model=schemas.User, dependencies=[Depends(PermissionChecker("User Management", "add"))])
def create_user(user_data: dict, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = models.User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker("User Management", "edit"))])
def update_user(user_id: str, user_data: dict, db: Session = Depends(get_db)):
    """Update a user"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.items():
        if hasattr(db_user, key):
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/{user_id}/toggle", dependencies=[Depends(PermissionChecker("User Management", "edit"))])
def toggle_user_status(user_id: str, db: Session = Depends(get_db)):
    """Toggle user active status"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", dependencies=[Depends(PermissionChecker("User Management", "delete"))])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
