import asyncio
from database import SessionLocal
from routers.user.venues import get_venue_slots

import json

db = SessionLocal()
try:
    from sqlalchemy import text
    branch = db.execute(text("SELECT id FROM admin_branches WHERE is_active=true LIMIT 1")).first()
    if branch:
        branch_id = str(branch.id)
        print("Branch ID:", branch_id)
        res = get_venue_slots(venue_id=branch_id, date="2026-04-09", game_type=None, db=db)
        print("Returned", len(res['slots']), "slots for today")
        if res['slots']:
            print("First slot:", res['slots'][0]['display_time'])
            print("Last slot:", res['slots'][-1]['display_time'])
    else:
        print("No branches found.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
