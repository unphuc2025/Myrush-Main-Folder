import os
import sys
from datetime import date, time
from uuid import UUID

# Set up environment
sys.path.append(os.getcwd())
from database import SessionLocal
import models
from utils.conflicts import check_court_availability_conflict

def reproduce_cooke_town_conflict():
    db = SessionLocal()
    try:
        # 1. Target Parameters (exactly as user reported)
        court_id = UUID("84df147f-18bd-409c-a5a5-d08f61acf51f") # BoxCricket - Cooke Town
        target_date = date(2026, 4, 14)
        s_time = time(18, 30)
        e_time = time(19, 30)
        
        print(f"--- SIMULATING BLOCK CREATION ---")
        print(f"Target: Court {court_id}, Date {target_date}, Time {s_time}-{e_time}")
        
        # 2. Run the conflict check (Custom test)
        # We'll just call the logic for bookings manually or modify conflicts.py temporarily
        conflict = check_court_availability_conflict(
            db=db,
            court_id=court_id,
            block_date=target_date,
            start_time=s_time,
            end_time=e_time,
            slice_mask=0
        )
        
        print(f"\nRESULT: {'ERROR: ' + conflict if conflict else 'SUCCESS (No Conflict Found)'}")
        
        if not conflict:
            print("\n!!! WARNING: Conflict was NOT detected. This is a BUG if a booking exists at this time.")
            
    finally:
        db.close()

if __name__ == "__main__":
    reproduce_cooke_town_conflict()
