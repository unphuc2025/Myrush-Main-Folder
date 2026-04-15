
import sys
import os
from datetime import date, datetime, timedelta

# Mocking enough to run the logic
sys.path.append(r'c:\Users\Z BOOK\Downloads\New folder\Myrush-Main-Folder\unified-backend')

from utils.booking_utils import get_now_ist, generate_allowed_slots_map
import database
import models

def debug_slots():
    db = next(database.get_db())
    now_ist = get_now_ist()
    today = now_ist.date()
    tomorrow = today + timedelta(days=1)
    
    # Get any court
    court = db.query(models.Court).first()
    if not court:
        print("No courts found in DB")
        return
    
    print(f"Testing Court: {court.name} (ID: {court.id})")
    print(f"Current IST: {now_ist}")
    print(f"Today: {today}")
    
    print("\n--- TODAY SLOTS ---")
    today_slots = generate_allowed_slots_map(db, court.id, today)
    print(f"Count: {len(today_slots)}")
    if today_slots:
        print(f"Keys: {list(today_slots.keys())[:5]} ... {list(today_slots.keys())[-5:]}")
    else:
        # Check why it's empty
        branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first()
        from utils.booking_utils import get_venue_hours
        from utils.booking_utils import get_venue_hours
        v_intervals = get_venue_hours(branch.opening_hours, today)
        print(f"Venue hours for {today}: {v_intervals}")
        print(f"Opening hours config: {branch.opening_hours}")
    
    print("\n--- TOMORROW SLOTS ---")
    tomorrow_slots = generate_allowed_slots_map(db, court.id, tomorrow)
    print(f"Count: {len(tomorrow_slots)}")

if __name__ == "__main__":
    debug_slots()
