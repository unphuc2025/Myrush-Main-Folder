import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas
from utils.notifier import Notifier
from typing import Optional, Dict, Any

async def notify_booking_event(
    event_type: str, # 'booking_confirmed' or 'booking_cancelled'
    booking_id: str,
    user_id: str
):
    """
    Background task to notify users and relevant admins about booking events.
    Created a fresh DB session to ensure thread safety.
    """
    db = SessionLocal()
    try:
        print(f"[BG-NOTIFY] Starting {event_type} for booking {booking_id}")
        # 1. Fetch Booking and context
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        if not booking:
            print(f"[BG-NOTIFY ERROR] Booking {booking_id} not found")
            return

        court = db.query(models.Court).filter(models.Court.id == booking.court_id).first()
        branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first() if court else None
        venue_name = branch.name if branch else "Venue"
        court_name = court.name if court else "Court"

        # 2. Determine Recipient Titles/Bodies
        if event_type == 'booking_confirmed':
            user_title, user_body = "Booking Confirmed! 🎉", f"Your booking for {court_name} at {venue_name} on {booking.booking_date} is confirmed."
            admin_title, admin_body = "New Booking Received 🏸", f"New booking for {court_name} at {venue_name} by user {user_id}."
            admin_notif_type = "new_booking_admin"
        else:
            refund_note = " Your refund has been initiated." if booking.payment_status == 'refunded' else ""
            user_title, user_body = "Booking Cancelled 🛑", f"Your booking for {venue_name} on {booking.booking_date} has been cancelled.{refund_note}"
            admin_title, admin_body = "Booking Cancelled ⚠️", f"Booking #{booking.booking_display_id} for {venue_name} has been cancelled by the user."
            admin_notif_type = "booking_cancelled_admin"

        # 3. Notify User
        await Notifier.send_notification(
            db=db,
            title=user_title,
            body=user_body,
            type=event_type,
            user_id=str(user_id),
            metadata_json={"booking_id": str(booking_id)}
        )

        # 4. Find & Notify Relevant Admins
        # Logic: Super Admins OR Admins with access to this branch
        admins_to_notify = db.query(models.Admin).filter(
            (models.Admin.role == 'super_admin') |
            (models.Admin.branch_id == court.branch_id)
        ).all()
        
        # Also check accessible_branches secondary relationship
        # This is a bit more complex in a query, so we'll do a quick manual filter if needed or just trust branch_id for now if it's the primary way.
        # Let's improve the query to be more comprehensive:
        
        # To hit admins who have this branch in their secondary 'accessible_branches'
        secondary_admins = db.query(models.Admin).join(models.Admin.accessible_branches).filter(
            models.Branch.id == court.branch_id
        ).all()
        
        # Merge lists (using set for uniqueness)
        all_admin_ids = set([str(a.id) for a in admins_to_notify] + [str(a.id) for a in secondary_admins])
        
        print(f"[BG-NOTIFY] Notifying {len(all_admin_ids)} admins")
        
        for aid in all_admin_ids:
            await Notifier.send_notification(
                db=db,
                title=admin_title,
                body=admin_body,
                type=admin_notif_type,
                admin_id=aid,
                metadata_json={"booking_id": str(booking_id)}
            )

    except Exception as e:
        print(f"[BG-NOTIFY ERROR] Critical failure: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
