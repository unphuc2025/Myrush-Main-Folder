from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CouponValidateRequest, CouponResponse
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

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
def validate_coupon(request: CouponValidateRequest, db: Session = Depends(get_db)):
    """
    Validate a coupon code and calculate discount
    """
    from sqlalchemy import text

    try:
        # Query to find the coupon
        query = text("""
            SELECT code, discount_type, discount_value, min_order_value, max_discount,
                   start_date, end_date, is_active
            FROM admin_coupons
            WHERE code = :code AND is_active = true
        """)

        result = db.execute(query, {"code": request.coupon_code.upper()}).fetchone()

        if not result:
            return CouponResponse(
                valid=False,
                message="Invalid coupon code"
            )

        code, discount_type, discount_value, min_order_value, max_discount, start_date, end_date, is_active = result

        # Check if coupon is within valid date range
        now = datetime.utcnow()
        if now < start_date or now > end_date:
            return CouponResponse(
                valid=False,
                message="Coupon has expired or is not yet valid"
            )

        # Check minimum order value
        if min_order_value and request.total_amount < float(min_order_value):
            return CouponResponse(
                valid=False,
                message=f"Order value must be at least ₹{min_order_value} to use this coupon"
            )

        # Calculate discount based on type
        if discount_type.lower() == 'percentage':
            discount_amount = (request.total_amount * float(discount_value)) / 100
            discount_percentage = float(discount_value)
        else:  # fixed amount
            discount_amount = float(discount_value)
            discount_percentage = (discount_amount / request.total_amount) * 100

        # Apply max discount limit if set
        if max_discount and discount_amount > float(max_discount):
            discount_amount = float(max_discount)

        final_amount = request.total_amount - discount_amount

        # Ensure final amount is not negative
        final_amount = max(0, final_amount)

        return CouponResponse(
            valid=True,
            discount_percentage=round(discount_percentage, 2),
            discount_amount=round(discount_amount, 2),
            final_amount=round(final_amount, 2),
            message=f"Valid coupon: {discount_percentage}% discount applied"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating coupon: {str(e)}")


@router.get("/available", response_model=List[AvailableCouponResponse])
def get_available_coupons(db: Session = Depends(get_db)):
    """
    Get all available active coupons for dropdown
    """
    from sqlalchemy import text

    try:
        # Query to get all active coupons within valid date range
        query = text("""
            SELECT code, discount_type, discount_value, min_order_value, max_discount, description, terms_condition, is_active, start_date, end_date
            FROM admin_coupons
            WHERE is_active = true
                AND start_date <= NOW()
                AND end_date >= NOW()
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
