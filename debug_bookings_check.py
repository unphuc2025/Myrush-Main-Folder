
import sys
from database import SessionLocal
import models
from sqlalchemy.orm import joinedload

def debug_bookings():
    db = SessionLocal()
    try:
        bookings = db.query(models.Booking).options(
            joinedload(models.Booking.user)
        ).limit(10).all()
        
        print(f"Found {len(bookings)} bookings.")
        for b in bookings:
            print(f"Booking ID: {b.id}")
            print(f"  User ID: {b.user_id}")
            print(f"  User Obj: {b.user}")
            if b.user:
                print(f"  User Phone: {b.user.phone_number}")
                print(f"  User First: '{b.user.first_name}'")
                print(f"  User Full: '{b.user.full_name}'")
            else:
                print("  USER IS NONE!")
            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_bookings()
