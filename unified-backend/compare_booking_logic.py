
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import date
import json

# Add current directory to path for imports
sys.path.append(os.getcwd())

from database import SQLALCHEMY_DATABASE_URL
import models

def compare_queries(court_id_str, date_str):
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    booking_date = date.fromisoformat(date_str)
    
    print(f"--- DIAGNOSING COURT: {court_id_str} ON {date_str} ---")
    
    # Logic from courts.py
    print("\n[COURTS.PY LOGIC]")
    active_bookings_courts = db.query(models.Booking).filter(
        models.Booking.court_id == court_id_str,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled'
    ).all()
    print(f"Found {len(active_bookings_courts)} bookings")
    for b in active_bookings_courts:
        print(f"  ID: {b.id}, Slots: {b.time_slots}")

    # Logic from payments.py (actually they are identical in code, but let's check if casting matters)
    print("\n[PAYMENTS.PY LOGIC (Identical but checking)]")
    active_bookings_payments = db.query(models.Booking).filter(
        models.Booking.court_id == court_id_str,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled'
    ).all()
    print(f"Found {len(active_bookings_payments)} bookings")

    # Try with explicit casting to UUID
    from uuid import UUID
    try:
        court_uuid = UUID(court_id_str)
        print(f"\n[EXPLICIT UUID LOGIC]")
        active_bookings_uuid = db.query(models.Booking).filter(
            models.Booking.court_id == court_uuid,
            models.Booking.booking_date == booking_date,
            models.Booking.status != 'cancelled'
        ).all()
        print(f"Found {len(active_bookings_uuid)} bookings")
    except Exception as e:
        print(f"Explicit UUID query failed: {e}")

    # Check the "h in booked_hours" logic
    def get_booked_hours(bookings):
        booked_hours = set()
        for b in bookings:
            t_slots = b.time_slots
            if isinstance(t_slots, str):
                try: t_slots = json.loads(t_slots)
                except: t_slots = []
            
            if t_slots and isinstance(t_slots, list):
                for s in t_slots:
                    try: 
                        t_str = s.get('start_time') or s.get('time')
                        if t_str:
                            booked_hours.add(int(str(t_str).split(':')[0]))
                    except: pass
        return booked_hours

    booked_hours_courts = get_booked_hours(active_bookings_courts)
    print(f"\nFinal Booked Hours: {sorted(list(booked_hours_courts))}")

    db.close()

if __name__ == "__main__":
    # Use the court ID from the user's previous context OR a common one
    # If the user just hit 409 for 09:00, let's look for bookings at 09:00 today/tomorrow
    target_date = date.today().isoformat()
    # Let's search for ANY booking today or tomorrow to see if we can find a problematic court
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT court_id, booking_date FROM booking WHERE status != 'cancelled' ORDER BY created_at DESC LIMIT 1")).fetchone()
        if res:
            compare_queries(str(res[0]), str(res[1]))
        else:
            print("No bookings found in DB to test with.")
