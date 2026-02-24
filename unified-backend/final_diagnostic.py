from sqlalchemy import create_engine, text
import json
from datetime import date

DATABASE_URL = "postgresql://postgres:Tfz9FMhOx3AvkO1W@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"

def diagnostic():
    engine = create_engine(DATABASE_URL)
    court_id = "59f712a2-4db3-93bb-0b14f1c7b15e"
    booking_date = date(2026, 2, 22)
    
    query = text("SELECT id, booking_display_id, time_slots, _deprecated_start_time_v2 as start_time, _deprecated_duration_minutes_v2 as duration_minutes, status FROM booking WHERE court_id = :cid AND booking_date = :bdate AND status != 'cancelled'")
    
    print(f"Executing query for court {court_id} on {booking_date}...")
    
    with engine.connect() as conn:
        result = conn.execute(query, {"cid": court_id, "bdate": booking_date}).fetchall()
        
    print(f"Found {len(result)} bookings.")
    
    def safe_json(val):
        if isinstance(val, str):
            try: return json.loads(val)
            except: return []
        return val or []

    booked_hours = set()
    for row in result:
        row_dict = dict(row._mapping)
        print(f"\nBooking ID: {row_dict['booking_display_id']} (Status: {row_dict['status']})")
        print(f"  Legacy Start: {row_dict['start_time']} (Type: {type(row_dict['start_time'])})")
        print(f"  Time Slots: {row_dict['time_slots']} (Type: {type(row_dict['time_slots'])})")
        
        t_slots = safe_json(row_dict['time_slots'])
        if t_slots and isinstance(t_slots, list):
            for s in t_slots:
                t_str = s.get('start_time') or s.get('time')
                print(f"    JSON Slot: {t_str}")
                if t_str:
                    try:
                        h = int(str(t_str).split(':')[0])
                        booked_hours.add(h)
                        print(f"      Matched Hour: {h}")
                    except: print(f"      FAILED to parse hour from {t_str}")
        else:
            print("    FALLING BACK to legacy columns...")
            try:
                legacy_start = row_dict['start_time']
                legacy_duration = row_dict['duration_minutes'] or 60
                if legacy_start:
                    if isinstance(legacy_start, str):
                        h_val = int(legacy_start.split(':')[0])
                    else:
                        h_val = legacy_start.hour
                    
                    num_hours = (legacy_duration + 59) // 60
                    print(f"      Legacy Hour: {h_val}, Duration: {legacy_duration}, Hours to add: {num_hours}")
                    for i in range(num_hours):
                        booked_hours.add((h_val + i) % 24)
            except Exception as e:
                print(f"      Legacy fallback FAILED: {e}")

    print(f"\nFinal set of Booked Hours: {sorted(list(booked_hours))}")

if __name__ == "__main__":
    diagnostic()
