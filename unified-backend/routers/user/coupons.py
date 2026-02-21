from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CouponValidateRequest, CouponResponse
from datetime import datetime
from typing import List, Optional, Annotated
from pydantic import BaseModel
import models
from dependencies import get_current_user
from utils.coupon_utils import validate_coupon_strictly

class AvailableCouponResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_order_value: Optional[float] = None
    max_discount: Optional[float] = None
    description: Optional[str] = None
    terms_condition: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter(prefix="/coupons", tags=["coupons"])

@router.post("/validate", response_model=CouponResponse)
def validate_coupon(
    request: CouponValidateRequest, 
    db: Session = Depends(get_db),
    current_user: Annotated[Optional[models.User], Depends(get_current_user)] = None
):
    """
    Validate a coupon code and calculate discount (Optional auth for per-user limits)
    """
    try:
        user_id = current_user.id if current_user else None
        result = validate_coupon_strictly(db, request.coupon_code, request.total_amount, user_id)
        
        if not result["valid"]:
            return CouponResponse(valid=False, message=result["message"])
            
        return CouponResponse(
            valid=True,
            discount_percentage=result["discount_percentage"],
            discount_amount=result["discount_amount"],
            final_amount=result["final_amount"],
            message=result["message"]
        )
    except Exception as e:
        print(f"[COUPONS API] Error validating: {e}")
        raise HTTPException(status_code=500, detail=f"Error validating coupon: {str(e)}")

@router.get("/available", response_model=List[AvailableCouponResponse])
def get_available_coupons(db: Session = Depends(get_db)):
    """
    Get all available active coupons for dropdown
    """
    from sqlalchemy import text

    try:
        # Query to get all active coupons within valid date range and under usage limit
        query = text("""
            SELECT code, discount_type, discount_value, min_order_value, max_discount, description, terms_condition, is_active, start_date, end_date
            FROM admin_coupons
            WHERE is_active = true
                AND start_date <= NOW()
                AND end_date >= NOW()
                AND (usage_limit IS NULL OR usage_count < usage_limit)
            ORDER BY code ASC
        """)

        results = db.execute(query).fetchall()
        
        # Log for debugging why some might not be show up
        print(f"[COUPONS] Fetched {len(results)} active coupons from DB")

        return [
            AvailableCouponResponse(
                code=row[0],
                discount_type=row[1],
                discount_value=float(row[2]),
                min_order_value=float(row[3]) if row[3] is not None else 0,
                max_discount=float(row[4]) if row[4] is not None else None,
                description=row[5] or "",
                terms_condition=row[6] or ""
            ) for row in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching available coupons: {str(e)}")
