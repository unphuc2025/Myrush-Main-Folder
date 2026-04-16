from firebase_admin import messaging
import models, crud, schemas
from sqlalchemy.orm import Session

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

        response = messaging.send(message)
        print(f'[FIREBASE] Successfully sent message: {response}')
        return {"success": 1, "message_id": response}
    except Exception as e:
        print(f"[FIREBASE ERROR] Failed to send notification: {e}")
        return {"success": 0, "error": str(e)}

def notify_user(db: Session, user_id: str, title: str, body: str, notification_type: str = 'system', metadata_json: dict = None):
    """Unified helper to send FCM push AND save to database history"""
    # 1. Save to DB history
    crud.create_notification(db, schemas.NotificationCreate(
        user_id=user_id,
        title=title,
        body=body,
        type=notification_type,
        metadata_json=metadata_json
    ))

    # 2. Get user's push tokens
    tokens = crud.get_push_tokens_for_user(db, user_id)
    active_tokens = [t.device_token for t in tokens if t.is_active]

    # 3. Send FCM to each token
    for token in active_tokens:
        send_fcm_notification(token, title, body, metadata_json)

def notify_admins(db: Session, title: str, body: str, notification_type: str = 'admin_alert', metadata_json: dict = None):
    """Notify all active administrators via DB and Push"""
    # 1. Get all active admins (Super Admin or Branch specific)
    # For now, targeting all super_admins for global alerts
    admins = db.query(models.Admin).filter(models.Admin.is_active == True).all()
    
    for admin in admins:
        # Save to DB history for admin
        crud.create_notification(db, schemas.NotificationCreate(
            admin_id=str(admin.id),
            title=title,
            body=body,
            type=notification_type,
            metadata_json=metadata_json
        ))

        # 2. Get tokens for this admin
        tokens = db.query(models.PushToken).filter(
            models.PushToken.admin_id == str(admin.id),
            models.PushToken.is_active == True
        ).all()

        # 3. Send FCM Push
        for token_obj in tokens:
            send_fcm_notification(token_obj.device_token, title, body, metadata_json)
