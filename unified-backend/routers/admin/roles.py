from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/roles",
    tags=["roles"]
)

@router.get("", response_model=List[schemas.RoleResponse])
@router.get("/", response_model=List[schemas.RoleResponse])
def get_all_roles(db: Session = Depends(get_db)):
    """Get all roles"""
    return db.query(models.Role).all()

@router.get("/{role_id}", response_model=schemas.RoleResponse)
def get_role(role_id: str, db: Session = Depends(get_db)):
    """Get a specific role by ID"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("", response_model=schemas.RoleResponse)
@router.post("/", response_model=schemas.RoleResponse)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    """Create a new role"""
    try:
        db_role = models.Role(
            name=role.name,
            permissions=role.permissions,
            is_active=role.is_active
        )
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Role with this name already exists")

@router.put("/{role_id}", response_model=schemas.RoleResponse)
def update_role(role_id: str, role_update: schemas.RoleUpdate, db: Session = Depends(get_db)):
    """Update a role"""
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_update.name:
        # Check uniqueness if name is changing
        if role_update.name != db_role.name:
            existing = db.query(models.Role).filter(models.Role.name == role_update.name).first()
            if existing:
                raise HTTPException(status_code=400, detail="Role with this name already exists")
        db_role.name = role_update.name
        
    if role_update.permissions is not None:
        db_role.permissions = role_update.permissions
        
    if role_update.is_active is not None:
        db_role.is_active = role_update.is_active
    
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/{role_id}")
def delete_role(role_id: str, db: Session = Depends(get_db)):
    """Delete a role"""
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Optional: Check if any admin is assigned to this role before deleting
    # if len(db_role.admins) > 0:
    #     raise HTTPException(status_code=400, detail="Cannot delete role assigned to users")
        
    db.delete(db_role)
    db.commit()
    return {"message": "Role deleted successfully"}
