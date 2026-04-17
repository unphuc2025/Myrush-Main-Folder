import asyncio
from database import SessionLocal
import models
import crud
from utils.notifier import Notifier

async def send_test():
    db = SessionLocal()
    try:
        # Find the first admin
        admin = db.query(models.Admin).first()
        if not admin:
            print("No admin found in database!")
            return
            
        print(f"Sending test notification to Admin: {admin.name} ({admin.id})")
        
        await Notifier.send_notification(
            db=db,
            title="Test Push from Antigravity 🚀",
            body="If you see this, your browser notifications are working correctly and the time should be accurate!",
            type="test_notification",
            admin_id=str(admin.id)
        )
        print("Success! Notification sent to history, websocket, and push (if tokens exist).")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(send_test())
