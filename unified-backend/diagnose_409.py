from sqlalchemy import text, create_engine

DATABASE_URL = "postgresql://postgres:Tfz9FMhOx3AvkO1W@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"

def diagnose():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # Check bookings for the problematic court
        court_id = "59f712a2-4db3-93bb-0b14f1c7b15e"
        date = "2026-02-22"
        
        print(f"Checking bookings for Court {court_id} on {date}...")
        query = text("""
            SELECT id, booking_display_id, time_slots, _deprecated_start_time_v2, status 
            FROM booking 
            WHERE court_id = :cid AND booking_date = :bdate AND status != 'cancelled'
        """)
        result = conn.execute(query, {"cid": court_id, "bdate": date}).fetchall()
        
        if not result:
            print("No active bookings found for this court/date.")
            return
            
        for row in result:
            print(f"\nBooking: {row.booking_display_id} (Status: {row.status})")
            print(f"Legacy Start Time: {row._deprecated_start_time_v2}")
            print(f"Time Slots JSON: {row.time_slots}")
            
            if row.time_slots:
                slots = row.time_slots
                if isinstance(slots, str):
                    try: slots = json.loads(slots)
                    except: pass
                
                if isinstance(slots, list):
                    for i, s in enumerate(slots):
                        print(f"  Slot {i}: Keys: {list(s.keys()) if isinstance(s, dict) else 'Not a dict'}")
                        if isinstance(s, dict):
                            print(f"    time: {s.get('time')}, start_time: {s.get('start_time')}")

if __name__ == "__main__":
    diagnose()
