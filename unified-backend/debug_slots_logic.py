
import sys
import os
from datetime import datetime, timedelta

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

from database import SessionLocal
import models
from utils.booking_utils import get_now_ist, get_venue_hours
import json

def debug_slots():
    db = SessionLocal()
    try:
        now_system = datetime.now()
        now_utc = datetime.utcnow()
        now_ist = get_now_ist()
        
        print(f"System Time: {now_system}")
        print(f"UTC Time:    {now_utc}")
        print(f"IST Time:    {now_ist}")
        print(f"Current Date: {now_ist.date()}")
        
        # Check a branch opening hours
        branch = db.query(models.Branch).filter(models.Branch.is_active == True).first()
        if branch:
            print(f"\nBranch: {branch.name} (ID: {branch.id})")
            print(f"Opening Hours Raw: {branch.opening_hours}")
            
            booking_date = now_ist.date()
            day_name = booking_date.strftime("%A").lower()
            day_short = day_name[:3]
            print(f"Today is: {day_name} ({day_short})")
            
            v_start, v_end = get_venue_hours(branch.opening_hours, booking_date)
            print(f"get_venue_hours returned: start={v_start}, end={v_end}")
            
            if v_start == 0.0 and v_end == 0.0:
                print("!!! VENUE IS CONSIDERED CLOSED FOR TODAY !!!")
                
            # Check opening_hours format
            if isinstance(branch.opening_hours, str):
                oh = json.loads(branch.opening_hours)
            else:
                oh = branch.opening_hours
                
            print(f"Parsed Opening Hours: {oh}")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_slots()
