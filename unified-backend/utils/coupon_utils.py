from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, Dict, Any
import models

def validate_coupon_strictly(db: Session, coupon_code: str, total_amount: float, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Strictly validate a coupon including:
    1. is_active flag
    2. Date range (start/end)
    3. Min order value
    4. Total usage limit
    5. Per-user usage limit
    """
    # 1. Fetch Coupon
    query = text("""
        SELECT id, code, discount_type, discount_value, min_order_value, max_discount,
               start_date, end_date, is_active, usage_limit, usage_count, per_user_limit
        FROM admin_coupons
        WHERE code = :code
    """)
    result = db.execute(query, {"code": coupon_code.upper()}).fetchone()

    if not result:
        return {"valid": False, "message": "Invalid coupon code"}

    (cp_id, code, disc_type, disc_val, min_val, max_disc, s_date, e_date, active, u_limit, u_count, pu_limit) = result

    # 2. Check Active Status
    if not active:
        return {"valid": False, "message": "This coupon is currently inactive"}

    # 3. Check Date Range
    now = datetime.utcnow()
    if now < s_date:
        return {"valid": False, "message": "Coupon is not yet valid"}
    if now > e_date:
        # Auto-deactivation logic (Optional, but good for cleanup)
        db.execute(text("UPDATE admin_coupons SET is_active = false WHERE id = :id"), {"id": cp_id})
        db.commit()
        return {"valid": False, "message": "Coupon has expired"}

    # 4. Check Total Usage Limit
    if u_limit and u_count >= u_limit:
        return {"valid": False, "message": "Coupon usage limit has been reached"}

    # 5. Check Per-User Limit
    if pu_limit and user_id:
        # Count bookings for this user with this coupon code
        user_usage_query = text("""
            SELECT COUNT(*) FROM booking 
            WHERE user_id = :user_id AND coupon_code = :code AND status != 'cancelled'
        """)
        user_usage_count = db.execute(user_usage_query, {"user_id": user_id, "code": code}).scalar()
        if user_usage_count >= pu_limit:
            return {"valid": False, "message": f"You have already used this coupon {user_usage_count} time(s). Limit is {pu_limit}."}

    # 6. Check Min Order Value
    if min_val and total_amount < float(min_val):
        return {"valid": False, "message": f"Order value must be at least ₹{min_val} to use this coupon"}

    # 7. Calculate Discount
    if disc_type.lower() == 'percentage':
        discount_amount = (total_amount * float(disc_val)) / 100
        discount_percentage = float(disc_val)
        if max_disc and discount_amount > float(max_disc):
            discount_amount = float(max_disc)
    else: # flat
        discount_amount = float(disc_val)
        discount_percentage = (discount_amount / total_amount) * 100 if total_amount > 0 else 0

    final_amount = max(0, total_amount - discount_amount)

    return {
        "valid": True,
        "discount_percentage": round(discount_percentage, 2),
        "discount_amount": round(discount_amount, 2),
        "final_amount": round(final_amount, 2),
        "message": "Coupon applied successfully"
    }

def increment_coupon_usage(db: Session, coupon_code: str):
    """Increment the usage count of a coupon"""
    if not coupon_code:
        return
    db.execute(
        text("UPDATE admin_coupons SET usage_count = usage_count + 1 WHERE code = :code"),
        {"code": coupon_code.upper()}
    )
    db.commit()
