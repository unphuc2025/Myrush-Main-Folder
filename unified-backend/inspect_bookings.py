
from sqlalchemy import create_engine, text
import json
import os
import sys

# Add current directory to path for imports
sys.path.append(os.getcwd())

from database import SQLALCHEMY_DATABASE_URL

def inspect_data():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("--- RECENT BOOKINGS ---")
        query = text("""
            SELECT id, booking_display_id, court_id, booking_date, time_slots, _deprecated_start_time_v2, status 
            FROM booking 
            WHERE status != 'cancelled'
            ORDER BY created_at DESC 
            LIMIT 20
        """)
        result = conn.execute(query).fetchall()
        
        for row in result:
            print(f"\nBooking: {row.booking_display_id} | Date: {row.booking_date} | Status: {row.status}")
            print(f"  Court ID: {row.court_id}")
            print(f"  Legacy Start Time: {row._deprecated_start_time_v2}")
            print(f"  Time Slots JSON: {row.time_slots}")
            
            # Simulate the hour extraction logic
            t_slots = row.time_slots
            if isinstance(t_slots, str):
                try: t_slots = json.loads(t_slots)
                except: t_slots = []
            
            if t_slots and isinstance(t_slots, list):
                for s in t_slots:
                    t_str = s.get('start_time') or s.get('time')
                    if t_str:
                        extracted_h = int(str(t_str).split(':')[0])
                        print(f"    Extracted Hour: {extracted_h} from '{t_str}'")

if __name__ == "__main__":
    inspect_data()
