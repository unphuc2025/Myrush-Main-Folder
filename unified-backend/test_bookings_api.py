from database import SessionLocal
import models
from routers.admin.bookings import get_all_bookings
import uuid

db = SessionLocal()
try:
    print("Testing get_all_bookings...")
    # Mocking dependencies if possible, but easier to just call the logic
    # We call the functional part or just query directly to see if relationships are broken
    bookings = db.query(models.Booking).all()
    print(f"Total bookings in DB: {len(bookings)}")
    
    # Try the actual router function logic (simulated)
    res = get_all_bookings(db=db, _=None, branch_filter=None)
    print(f"Router returned {len(res)} bookings successfully.")
except Exception as e:
    import traceback
    print("Error occurred:")
    traceback.print_exc()
finally:
    db.close()
