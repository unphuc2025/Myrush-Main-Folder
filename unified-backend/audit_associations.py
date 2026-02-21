from database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
try:
    print("--- GAME TYPES ---")
    game_types = db.execute(text("SELECT id, name FROM admin_game_types")).fetchall()
    for gt in game_types:
        print(f"ID: {gt.id} | Name: '{gt.name}'")

    print("\n--- COURTS & BRANCHES WITH GAME TYPES ---")
    query = """
    SELECT 
        ac.name as court_name, 
        ab.name as branch_name, 
        agt.name as game_type,
        ac.is_active as court_active,
        ab.is_active as branch_active,
        ab.opening_hours
    FROM admin_courts ac
    JOIN admin_branches ab ON ac.branch_id = ab.id
    JOIN admin_game_types agt ON ac.game_type_id = agt.id
    WHERE ac.is_active = true AND ab.is_active = true
    """
    results = db.execute(text(query)).fetchall()
    for r in results:
        print(f"Court: {r.court_name} | Branch: {r.branch_name} | Sport: {r.game_type}")
        print(f"  Branch Open Hours: {r.opening_hours is not None}")
        if r.opening_hours:
            # Check if Friday (today) is active
            import datetime
            today_full = datetime.datetime.now().strftime("%A").lower()
            oh_dict = r.opening_hours
            day_config = oh_dict.get(today_full, {})
            print(f"  Today ({today_full}) Active: {day_config.get('isActive')}")
        print("-" * 20)

finally:
    db.close()
