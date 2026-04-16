import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Role Manager (ID: eabd641b-9ef6-4872-817a-f78e818c6368)
    # Permissions: Settings (view=True, delete=True, edit=False, add=False)
    # FAQ (view=True, access=True, delete=True, edit=False)
    permissions = {
        "Settings": {"view": True, "access": True, "delete": True, "edit": False, "add": False},
        "FAQ": {"view": True, "access": True, "delete": True, "edit": False, "add": False},
        "Manage Bookings": {"view": True, "access": True, "delete": True, "edit": True, "add": True}
    }
    
    conn.execute(text("UPDATE admin_roles SET permissions = :perms WHERE id = 'eabd641b-9ef6-4872-817a-f78e818c6368'"), {"perms": json.dumps(permissions)})
    conn.execute(text("UPDATE admins SET must_change_password = false WHERE mobile = '7204279799'"))
    conn.commit()
    print("Prepared DB: Settings(View,Delete), FAQ(View,Delete). User 7204279799 ready.")
