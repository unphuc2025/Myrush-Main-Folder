from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Union
import schemas, crud, models
from dependencies import get_current_user, get_current_admin, get_current_user_or_admin
from database import get_db

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

from firebase_admin import messaging

def send_fcm_notification(device_token: str, title: str, body: str, data: dict = None):
    """Send FCM notification to a single device using V1 API"""
    try:
        # Prepare data (all values must be strings for V1 'data' field)
        data_str = {}
        if data:
            for k, v in data.items():
                data_str[str(k)] = str(v)

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data_str,
            token=device_token,
        )

        # Send a message to the device corresponding to the provided registration token.
        response = messaging.send(message)
        # Response is a message ID string.
        print(f'[FIREBASE] Successfully sent message: {response}')
        return {"success": 1, "message_id": response}
    except Exception as e:
        print(f"[FIREBASE ERROR] Failed to send notification: {e}")
        return {"success": 0, "error": str(e)}

# ============================================================================
# USER TOKEN & SENDING ENDPOINTS
# ============================================================================

@router.post("/tokens/", response_model=schemas.PushTokenResponse)
def register_push_token(
    token_data: schemas.PushTokenCreate,
    current_sender: Union[models.User, models.Admin] = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    """Register or update a push token for the current user or admin"""
    try:
        user_id = str(current_sender.id) if isinstance(current_sender, models.User) else None
        admin_id = str(current_sender.id) if isinstance(current_sender, models.Admin) else None
        
        token = crud.create_push_token(db, token_data, user_id=user_id, admin_id=admin_id)
        return token
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to register token: {str(e)}")

@router.get("/tokens/", response_model=List[schemas.PushTokenResponse])
def get_user_push_tokens(
    current_sender: Union[models.User, models.Admin] = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    """Get all active push tokens for the current user or admin"""
    if isinstance(current_sender, models.User):
        tokens = crud.get_push_tokens_for_user(db, str(current_sender.id))
    else:
        # Fetch tokens for admin
        tokens = db.query(models.PushToken).filter(
            models.PushToken.admin_id == str(current_sender.id),
            models.PushToken.is_active == True
        ).all()
    return tokens

@router.delete("/tokens/{device_token}")
def deactivate_push_token(
    device_token: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate a push token"""
    success = crud.deactivate_push_token(db, device_token)
    if not success:
        raise HTTPException(status_code=404, detail="Token not found")
    return {"message": "Token deactivated successfully"}

@router.post("/send/", response_model=schemas.SendNotificationResponse)
def send_notification(
    notification_data: schemas.SendNotificationRequest,
    current_sender: Union[models.User, models.Admin] = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    """Send push notifications to specified users or device tokens"""
    sent_count = 0
    failed_count = 0
    errors = []

    try:
        # Get target tokens
        target_tokens = []
        if notification_data.user_ids:
            for user_id in notification_data.user_ids:
                user_tokens = crud.get_push_tokens_for_user(db, user_id)
                target_tokens.extend([t.device_token for t in user_tokens if t.is_active])
        
        if notification_data.device_tokens:
            target_tokens.extend(notification_data.device_tokens)
        
        # Remove duplicates
        target_tokens = list(set(target_tokens))

        # Send notifications
        for token in target_tokens:
            res = send_fcm_notification(
                token, 
                notification_data.title, 
                notification_data.body, 
                notification_data.metadata_json
            )
            if res.get("success"):
                sent_count += 1
            else:
                failed_count += 1
                errors.append(res.get("error"))

        # Save to database history if user_ids were provided
        if notification_data.user_ids:
            for user_id in notification_data.user_ids:
                crud.create_notification(db, schemas.NotificationCreate(
                    user_id=user_id,
                    title=notification_data.title,
                    body=notification_data.body,
                    type=notification_data.type,
                    metadata_json=notification_data.metadata_json
                ))

        return {
            "sent_count": sent_count,
            "failed_count": failed_count,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inbox", response_model=schemas.NotificationListResponse)
def get_user_notifications(
    limit: int = 50,
    skip: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user"""
    items, unread_count = crud.get_notifications(db, user_id=str(current_user.id), limit=limit, skip=skip)
    return {
        "items": items,
        "unread_count": unread_count
    }

@router.post("/read-all")
def mark_all_user_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all user notifications as read"""
    count = crud.mark_all_notifications_as_read(db, user_id=str(current_user.id))
    return {"message": f"Marked {count} notifications as read"}

@router.patch("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_user_notification_read(
    notification_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read"""
    notification = crud.mark_notification_as_read(db, notification_id)
    if not notification or str(notification.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/inbox", response_model=schemas.NotificationListResponse)
def get_admin_notifications(
    limit: int = 50,
    skip: int = 0,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get notifications for the current admin"""
    items, unread_count = crud.get_notifications(db, admin_id=str(current_admin.id), limit=limit, skip=skip)
    return {
        "items": items,
        "unread_count": unread_count
    }

@router.post("/admin/read-all")
def mark_all_admin_notifications_read(
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark all admin notifications as read"""
    count = crud.mark_all_notifications_as_read(db, admin_id=str(current_admin.id))
    return {"message": f"Marked {count} notifications as read"}

@router.patch("/admin/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_admin_notification_read(
    notification_id: str,
    current_admin: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark a specific admin notification as read"""
    notification = crud.mark_notification_as_read(db, notification_id)
    if not notification or str(notification.admin_id) != str(current_admin.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
