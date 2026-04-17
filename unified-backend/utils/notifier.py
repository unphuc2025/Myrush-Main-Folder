from sqlalchemy.orm import Session
import crud, schemas, models
from utils.websocket_manager import manager
from utils.notifications import send_fcm_notification
from typing import Optional, List, Dict, Any

class Notifier:
    @staticmethod
    async def send_notification(
        db: Session,
        title: str,
        body: str,
        type: str,
        user_id: Optional[str] = None,
        admin_id: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
        send_push: bool = True
    ):
        """
        Omnichannel notification sender.
        Sends to DB (history), WebSocket (real-time), and FCM (push).
        """
        # 1. Save to Database (Inbox History)
        notification_data = schemas.NotificationCreate(
            user_id=user_id,
            admin_id=admin_id,
            title=title,
            body=body,
            type=type,
            metadata_json=metadata_json
        )
        db_notification = crud.create_notification(db, notification_data)
        
        # Prepare response object for JSON serialization
        response_payload = {
            "id": str(db_notification.id),
            "title": title,
            "body": body,
            "type": type,
            "metadata_json": metadata_json,
            "is_read": False,
            "created_at": db_notification.created_at.isoformat()
        }

        # 2. Send via WebSocket (Real-Time)
        identifier = user_id or admin_id
        if identifier:
            await manager.send_personal_message(
                {"event": "notification", "data": response_payload},
                str(identifier)
            )

        # 3. Send via FCM (Push Notification)
        if send_push:
            try:
                # 3a. User Push
                if user_id:
                    user_tokens = crud.get_push_tokens_for_user(db, str(user_id))
                    for token_obj in user_tokens:
                        try:
                            send_fcm_notification(
                                token_obj.device_token,
                                title,
                                body,
                                metadata_json
                            )
                        except Exception as e:
                            print(f"[NOTIFIER] User push failed for token: {e}")
                
                # 3b. Admin Push
                if admin_id:
                    admin_tokens = crud.get_push_tokens_for_admin(db, str(admin_id))
                    for token_obj in admin_tokens:
                        try:
                            send_fcm_notification(
                                token_obj.device_token,
                                title,
                                body,
                                metadata_json
                            )
                        except Exception as e:
                            print(f"[NOTIFIER] Admin push failed for token: {e}")
                    
            except Exception as e:
                print(f"[NOTIFIER] Could not fetch tokens or send push: {e}")

        return db_notification

    @staticmethod
    async def broadcast_notification(
        db: Session,
        title: str,
        body: str,
        type: str,
        metadata_json: Optional[Dict[str, Any]] = None
    ):
        """Broadcast a notification to everyone via WebSocket (doesn't save to DB individual inboxes)"""
        await manager.broadcast({
            "event": "broadcast",
            "data": {
                "title": title,
                "body": body,
                "type": type,
                "metadata_json": metadata_json
            }
        })
