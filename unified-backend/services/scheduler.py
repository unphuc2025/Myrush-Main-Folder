import asyncio
import logging
from datetime import datetime, time, timedelta
import crud
import models
from database import SessionLocal
from utils.notifier import Notifier
from utils.booking_utils import get_now_ist

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scheduler")

async def reminder_job():
    """
    Scans for bookings starting in 1 hour and sends push notifications.
    Runs every 15 minutes.
    """
    while True:
        try:
            logger.info("[SCHEDULER] Running reminder job...")
            db = SessionLocal()
            try:
                bookings = crud.get_bookings_for_reminders(db)
                if bookings:
                    logger.info(f"[SCHEDULER] Found {len(bookings)} bookings for reminders.")
                    for b in bookings:
                        # Fetch court/venue info
                        court = db.query(models.Court).filter(models.Court.id == b.court_id).first()
                        branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first() if court else None
                        venue_name = branch.name if branch else "Venue"
                        
                        # Send Notification
                        await Notifier.send_notification(
                            db=db,
                            title="Upcoming Booking Reminder! 🎾",
                            body=f"Don't forget! Your booking at {venue_name} starts in 1 hour at {b.start_time.strftime('%I:%M %p')}.",
                            type="booking_reminder",
                            user_id=str(b.user_id),
                            metadata_json={"booking_id": str(b.id)}
                        )
                        
                        # Mark as sent
                        b.reminder_sent = True
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"[SCHEDULER ERROR] Reminder job failed: {e}")
            
        # Wait 15 minutes
        await asyncio.sleep(900)

async def review_prompt_job():
    """
    Scans for bookings that ended 2 hours ago and sends review prompts.
    Runs every 15 minutes.
    """
    while True:
        try:
            logger.info("[SCHEDULER] Running review prompt job...")
            db = SessionLocal()
            try:
                bookings = crud.get_bookings_for_review_prompts(db)
                if bookings:
                    logger.info(f"[SCHEDULER] Found {len(bookings)} bookings for review prompts.")
                    for b in bookings:
                        # Fetch court info
                        court = db.query(models.Court).filter(models.Court.id == b.court_id).first()
                        venue_name = "the venue"
                        if court:
                            branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first()
                            venue_name = branch.name if branch else court.name

                        await Notifier.send_notification(
                            db=db,
                            title="How was your game? 🏸",
                            body=f"We hope you enjoyed your session at {venue_name}! Rate your experience now.",
                            type="review_prompt",
                            user_id=str(b.user_id),
                            metadata_json={"booking_id": str(b.id)}
                        )
                        b.review_prompt_sent = True
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"[SCHEDULER ERROR] Review prompt job failed: {e}")
        await asyncio.sleep(900)

async def expiry_alert_job():
    """
    Scans for pending bookings created 7-10 mins ago and sends reminder to pay.
    Runs every 3 minutes.
    """
    while True:
        try:
            db = SessionLocal()
            try:
                bookings = crud.get_bookings_for_expiry_alerts(db)
                if bookings:
                    logger.info(f"[SCHEDULER] Found {len(bookings)} pending bookings nearing expiry.")
                    for b in bookings:
                        await Notifier.send_notification(
                            db=db,
                            title="Secure your slot! ⚡",
                            body="Your booking hold is about to expire. Complete your payment now to confirm your court!",
                            type="payment_expiry_warning",
                            user_id=str(b.user_id),
                            metadata_json={"booking_id": str(b.id), "display_id": b.booking_display_id}
                        )
                        b.expiry_alert_sent = True
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"[SCHEDULER ERROR] Expiry alert job failed: {e}")
        await asyncio.sleep(180)

async def summary_job():
    """
    Sends a daily summary to super admins and branch admins at 10:00 PM (22:00 IST).
    Checks every 30 minutes.
    """
    last_summary_date = None
    
    while True:
        try:
            now = get_now_ist()
            
            # Check if it's 22:00 or later AND we haven't sent summary for today
            if now.hour >= 22 and last_summary_date != now.date():
                logger.info("[SCHEDULER] Running daily summary job...")
                db = SessionLocal()
                try:
                    # 1. Global Summary (Super Admins)
                    summary = crud.get_daily_summary_data(db)
                    super_admins = db.query(models.Admin).filter(
                        models.Admin.role == 'super_admin'
                    ).all()
                    
                    if super_admins:
                        msg_title = f"Daily Revenue Summary: {summary['date']} 💰"
                        msg_body = f"Total Bookings: {summary['total_bookings']}\nTotal Revenue: ₹{summary['total_revenue']:.2f}"
                        for admin in super_admins:
                            await Notifier.send_notification(
                                db=db,
                                title=msg_title,
                                body=msg_body,
                                type="daily_summary_admin",
                                admin_id=str(admin.id),
                                metadata_json=summary
                            )

                    # 2. Branch-Specific Summaries (Branch Admins)
                    branches = db.query(models.Branch).all()
                    for branch in branches:
                        branch_stats = crud.get_branch_daily_summary_data(db, str(branch.id))
                        if branch_stats['total_bookings'] > 0:
                            # Notify admins of THIS branch
                            branch_admins = db.query(models.Admin).filter(
                                (models.Admin.branch_id == branch.id) |
                                (models.Admin.id.in_(
                                    db.query(models.AdminBranchAccess.admin_id).filter(
                                        models.AdminBranchAccess.branch_id == branch.id
                                    )
                                ))
                            ).filter(models.Admin.role != 'super_admin').all()
                            
                            if branch_admins:
                                b_title = f"{branch.name} Daily Stats 📈"
                                b_body = f"Bookings Today: {branch_stats['total_bookings']}\nRevenue: ₹{branch_stats['total_revenue']:.2f}"
                                for badmin in branch_admins:
                                    await Notifier.send_notification(
                                        db=db,
                                        title=b_title,
                                        body=b_body,
                                        type="branch_summary_admin",
                                        admin_id=str(badmin.id),
                                        metadata_json=branch_stats
                                    )

                    logger.info(f"[SCHEDULER] Daily summaries sent.")
                    last_summary_date = now.date()
                finally:
                    db.close()
        except Exception as e:
            logger.error(f"[SCHEDULER ERROR] Summary job failed: {e}")
            
        await asyncio.sleep(1800)

async def start_scheduler():
    """Entry point to start all background tasks"""
    logger.info("[SCHEDULER] Starting MyRush Background Services...")
    # Using gather to run them concurrently
    await asyncio.gather(
        reminder_job(),
        summary_job(),
        review_prompt_job(),
        expiry_alert_job()
    )
