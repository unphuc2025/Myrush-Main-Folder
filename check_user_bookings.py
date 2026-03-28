import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path='unified-backend/.env')
engine = create_engine(os.getenv('DATABASE_URL'))

USER_ID = "c58eded9-4026-44b4-b875-af7550e3b7ea"

with engine.connect() as db:
    sql = text("SELECT id, booking_date, time_slots, status, court_id FROM booking WHERE user_id = :uid AND status != 'cancelled'")
    res = db.execute(sql, {"uid": USER_ID}).fetchall()
    print(f"--- Active Bookings for User {USER_ID} ---")
    for r in res:
        print(f"ID: {r[0]} | Date: {r[1]} | Slots: {r[2]} | Status: {r[3]} | Court: {r[4]}")
