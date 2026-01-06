from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas, crud, models
from dependencies import get_current_user
from database import get_db
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

# FCM Configuration
FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY')
FCM_URL = 'https://fcm.googleapis.com/fcm/send'

def send_fcm_notification(device_token: str, title: str, body: str, data: dict = None):
    """Send FCM notification to a single device"""
    if not FCM_SERVER_KEY:
        raise HTTPException(status_code=500, detail="FCM server key not configured")

    headers = {
        'Authorization': f'key={FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }

    payload = {
        "to": device_token,
        "notification": {
            "title": title,
            "body": body,
            "sound": "default",
            "click_action": "FLUTTER_NOTIFICATION_CLICK"
        }
    }

    if data:
        payload["data"] = data

    try:
        response = requests.post(FCM_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"FCM request failed: {str(e)}")

@router.post("/tokens/", response_model=schemas.PushTokenResponse)
def register_push_token(
    token_data: schemas.PushTokenCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register or update a push token for the current user"""
    try:
        token = crud.create_push_token(db, token_data, str(current_user.id))
        return token
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to register token: {str(e)}")

@router.get("/tokens/", response_model=List[schemas.PushTokenResponse])
def get_user_push_tokens(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active push tokens for the current user"""
    tokens = crud.get_push_tokens_for_user(db, str(current_user.id))
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
    current_user: models.User = Depends(get_current_user),
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
            # Get tokens for specific users
            for user_id in notification_data.user_ids:
                user_tokens = crud.get_push_tokens_for_user(db, user_id)
                target_tokens.extend([token.device_token for token in user_tokens])

        if notification_data.device_tokens:
            # Add specific device tokens
            target_tokens.extend(notification_data.device_tokens)

        # Remove duplicates
        target_tokens = list(set(target_tokens))

        if not target_tokens:
            return schemas.SendNotificationResponse(
                success=False,
                message="No valid device tokens found",
                sent_count=0,
                failed_count=0,
                errors=["No target tokens available"]
            )

        # Send notifications
        for token in target_tokens:
            try:
                result = send_fcm_notification(
                    token,
                    notification_data.title,
                    notification_data.body,
                    notification_data.data
                )

                if result.get('success') == 1:
                    sent_count += 1
                    # Update last_used_at for successful sends
                    crud.update_push_token_last_used(db, token)
                else:
                    failed_count += 1
                    errors.append(f"Failed to send to token {token[:20]}...: {result}")

            except Exception as e:
                failed_count += 1
                errors.append(f"Error sending to token {token[:20]}...: {str(e)}")

        success = sent_count > 0

        return schemas.SendNotificationResponse(
            success=success,
            message=f"Sent {sent_count} notifications, {failed_count} failed",
            sent_count=sent_count,
            failed_count=failed_count,
            errors=errors if errors else None
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification sending failed: {str(e)}")

@router.post("/test/", response_model=schemas.SendNotificationResponse)
def send_test_notification(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a test notification to the current user's devices"""
    try:
        # Get user's active tokens
        user_tokens = crud.get_push_tokens_for_user(db, str(current_user.id))

        if not user_tokens:
            return schemas.SendNotificationResponse(
                success=False,
                message="No active device tokens found for user",
                sent_count=0,
                failed_count=0,
                errors=["User has no registered device tokens"]
            )

        # Send test notification to user's tokens
        sent_count = 0
        failed_count = 0
        errors = []

        for token_obj in user_tokens:
            try:
                result = send_fcm_notification(
                    token_obj.device_token,
                    "Test Notification",
                    f"Hello {current_user.first_name or 'User'}! This is a test push notification from MyRush.",
                    {"type": "test", "user_id": str(current_user.id)}
                )

                if result.get('success') == 1:
                    sent_count += 1
                    crud.update_push_token_last_used(db, token_obj.device_token)
                else:
                    failed_count += 1
                    errors.append(f"Failed to send to {token_obj.device_type} device")

            except Exception as e:
                failed_count += 1
                errors.append(f"Error sending to {token_obj.device_type} device: {str(e)}")

        success = sent_count > 0

        return schemas.SendNotificationResponse(
            success=success,
            message=f"Test notification sent to {sent_count} device(s)",
            sent_count=sent_count,
            failed_count=failed_count,
            errors=errors if errors else None
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test notification failed: {str(e)}")

@router.get("/stats/")
def get_notification_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics for the current user"""
    try:
        user_tokens = crud.get_push_tokens_for_user(db, str(current_user.id))

        stats = {
            "total_tokens": len(user_tokens),
            "active_tokens": len([t for t in user_tokens if t.is_active]),
            "tokens_by_device": {}
        }

        # Group by device type
        for token in user_tokens:
            device_type = token.device_type
            if device_type not in stats["tokens_by_device"]:
                stats["tokens_by_device"][device_type] = 0
            stats["tokens_by_device"][device_type] += 1

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
