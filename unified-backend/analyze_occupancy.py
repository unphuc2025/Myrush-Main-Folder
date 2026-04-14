
from database import SessionLocal
import models
from utils.booking_utils import get_consolidated_occupied_mask
from datetime import date
from sqlalchemy import text

db = SessionLocal()
b_date = date.today()
court_id = "84df147f-18bd-409c-a5a5-d08f61acf51f" # BoxCricket Cooke Town

print(f"--- Running Occupancy Analysis for {b_date} at BoxCricket Cooke Town ---")

# 1. Fetch ALL active bookings for this branch and date
sql = text("""
    SELECT b.id, b.court_id, b.slice_mask, b.status, b.time_slots
    FROM booking b
    JOIN admin_courts c ON b.court_id = c.id
    WHERE c.branch_id = '5a28925c-c412-4115-8e9d-657fb44fc04a'
    AND b.booking_date = :d
    AND (b.status != 'cancelled' OR b.status IS NULL)
""")
bookings = db.execute(sql, {"d": b_date}).fetchall()

print(f"Found {len(bookings)} active bookings for this branch/date.")
for b in bookings:
    print(f"Booking ID: {b.id} | Mask: {b.slice_mask} | Status: {b.status} | Court: {b.court_id}")
    # print(f"  Slots: {b.time_slots}")

# 2. Run the dynamic aggregation
masks, players = get_consolidated_occupied_mask(db, b_date, court_id)

print("\n--- Aggregated Masks (Slots with Occupancy) ---")
sorted_keys = sorted(masks.keys())
found = False
for k in sorted_keys:
    if masks[k] > 0:
        print(f"Time: {k} | Occupied Mask: {masks[k]} (Binary: {bin(masks[k])[2:].zfill(4)})")
        found = True

if not found:
    print("NO SLOTS ARE CURRENTLY BLOCKED!")

db.close()
