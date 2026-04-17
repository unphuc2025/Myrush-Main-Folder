from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas, crud, models
from database import get_db

# Reuse the admin dependency from another admin router or create a placeholder if unknown
# I'll check routers/admin/auth.py or similar to find the correct dependency
from routers.admin.auth import get_current_admin

router = APIRouter(
    prefix="/notifications/admin",
    tags=["admin-notifications"],
)

@router.get("/inbox", response_model=schemas.NotificationListResponse)
def get_admin_inbox(
    limit: int = 50,
    skip: int = 0,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Fetch paginated notification history for the admin"""
    items, unread_count = crud.get_notifications(
        db, 
        admin_id=str(current_admin.id), 
        limit=limit, 
        skip=skip
    )
    return {
        "items": items,
        "unread_count": unread_count
    }

@router.patch("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_admin_notification_read(
    notification_id: str,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read"""
    notif = crud.mark_notification_as_read(db, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.post("/read-all")
def mark_all_admin_notifications_read(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark all notifications for the current admin as read"""
    count = crud.mark_all_notifications_as_read(db, admin_id=str(current_admin.id))
    return {"message": f"Marked {count} notifications as read"}
