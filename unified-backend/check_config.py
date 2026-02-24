import sys
import os
from datetime import date

# Add current dir to path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from database import SessionLocal
import models
import json

def check_config():
    db = SessionLocal()
    try:
        # 1. Check Global Rules
        globals = db.query(models.GlobalPriceCondition).filter(models.GlobalPriceCondition.is_active == True).all()
        print(f"--- GLOBAL RULES ({len(globals)}) ---")
        for g in globals:
            print(f"ID: {g.id} | Type: {g.condition_type} | Days: {g.days} | Dates: {g.dates} | Time: {g.slot_from}-{g.slot_to} | Price: {g.price}")

        # 2. Check Courts
        courts = db.query(models.Court).all()
        print(f"\n--- COURTS ({len(courts)}) ---")
        for c in courts:
            print(f"Court: {c.name} (ID: {c.id})")
            print(f"  Base Price: {c.price_per_hour}")
            p_cond = c.price_conditions
            if isinstance(p_cond, str): p_cond = json.loads(p_cond)
            print(f"  Price Conditions: {len(p_cond or [])} rules")
            # Log first few rules
            for pc in (p_cond or [])[:3]:
                print(f"    - {pc}")
            
            un_slots = c.unavailability_slots
            if isinstance(un_slots, str): un_slots = json.loads(un_slots)
            print(f"  Blocked Slots: {len(un_slots or [])} rules")

    finally:
        db.close()

if __name__ == "__main__":
    check_config()
