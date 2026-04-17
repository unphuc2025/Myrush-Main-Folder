import asyncio
from database import SessionLocal
from utils.notifier import Notifier
import sys

async def trigger_test():
    print("--- Sending Test Notification ---")
    db = SessionLocal()
    
    # Target User ID (Matching phone: 6303191808)
    user_id = "e2696e83-1f27-470c-ab08-4e3467e788e5"
    
    title = "Test Notification 🚀"
    body = "Hello! This is a real-time test notification from your new system. It works via WebSockets and FCM!"
    msg_type = "test_alert"
    
    print(f"Targeting User: {user_id}")
    
    try:
        # We call the static method. 
        # Note: WebSocket broadcast only works if the server is ALREADY running and has active connections.
        # But this will definitely hit the DB history and FCM.
        await Notifier.send_notification(
            db=db,
            title=title,
            body=body,
            type=msg_type,
            user_id=user_id,
            send_push=True # This will trigger FCM V1!
        )
        print("Successfully triggered notification logic.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(trigger_test())
