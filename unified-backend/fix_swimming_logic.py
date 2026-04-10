import database
import models
from sqlalchemy import text

def fix_swimming_logic():
    db = database.SessionLocal()
    try:
        print("Checking for Swimming and Skating courts...")
        
        # 1. Swimming should usually be capacity-based
        swimming_update = text("""
            UPDATE admin_courts
            SET logic_type = 'capacity'
            WHERE id IN (
                SELECT ac.id 
                FROM admin_courts ac
                JOIN admin_game_types agt ON ac.game_type_id = agt.id
                WHERE agt.name ILIKE '%swimming%' AND ac.logic_type != 'capacity'
            )
        """)
        res1 = db.execute(swimming_update)
        print(f"Updated {res1.rowcount} Swimming courts to 'capacity'.")
        
        # 2. Skating should also be capacity-based (most are, but let's be sure)
        skating_update = text("""
            UPDATE admin_courts
            SET logic_type = 'capacity'
            WHERE id IN (
                SELECT ac.id 
                FROM admin_courts ac
                JOIN admin_game_types agt ON ac.game_type_id = agt.id
                WHERE agt.name ILIKE '%skating%' AND ac.logic_type != 'capacity'
            )
        """)
        res2 = db.execute(skating_update)
        print(f"Updated {res2.rowcount} Skating courts to 'capacity'.")
        
        db.commit()
        print("Done.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_swimming_logic()
