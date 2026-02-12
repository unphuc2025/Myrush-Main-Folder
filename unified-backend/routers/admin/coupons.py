from fastapi import APIRouter, Depends, HTTPException, status
from dependencies import PermissionChecker
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
import uuid

router = APIRouter(
    prefix="/coupons",
    tags=["coupons"]
)

@router.get("", response_model=List[schemas.Coupon], dependencies=[Depends(PermissionChecker("Manage Coupons", "view"))])
@router.get("/", response_model=List[schemas.Coupon], dependencies=[Depends(PermissionChecker("Manage Coupons", "view"))])
def get_coupons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all coupons"""
    coupons = db.query(models.Coupon).offset(skip).limit(limit).all()
    return coupons

@router.post("", response_model=schemas.Coupon, dependencies=[Depends(PermissionChecker("Manage Coupons", "add"))])
@router.post("/", response_model=schemas.Coupon, dependencies=[Depends(PermissionChecker("Manage Coupons", "add"))])
def create_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db)):
    """Create a new coupon"""
    # Check if code exists
    existing_coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon.code).first()
    if existing_coupon:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    db_coupon = models.Coupon(**coupon.dict())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

@router.put("/{coupon_id}", response_model=schemas.Coupon, dependencies=[Depends(PermissionChecker("Manage Coupons", "edit"))])
def update_coupon(coupon_id: str, coupon: schemas.CouponCreate, db: Session = Depends(get_db)):
    """Update a coupon"""
    db_coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not db_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Check uniqueness if code is changed
    if coupon.code != db_coupon.code:
        existing = db.query(models.Coupon).filter(models.Coupon.code == coupon.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    for key, value in coupon.dict().items():
        setattr(db_coupon, key, value)
    
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

@router.delete("/{coupon_id}", dependencies=[Depends(PermissionChecker("Manage Coupons", "delete"))])
def delete_coupon(coupon_id: str, db: Session = Depends(get_db)):
    """Delete a coupon"""
    db_coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not db_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    db.delete(db_coupon)
    db.commit()
    return {"message": "Coupon deleted successfully"}

@router.patch("/{coupon_id}/toggle", response_model=schemas.Coupon, dependencies=[Depends(PermissionChecker("Manage Coupons", "edit"))])
def toggle_coupon_status(coupon_id: str, db: Session = Depends(get_db)):
    """Toggle coupon active status"""
    db_coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not db_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    db_coupon.is_active = not db_coupon.is_active
    db.commit()
    db.refresh(db_coupon)
    return db_coupon
