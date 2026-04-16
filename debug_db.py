import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("--- ADMINS ---")
    res = conn.execute(text("SELECT id, mobile, role_id, must_change_password FROM admins WHERE mobile = '7204279799'"))
    for row in res:
        print(dict(row._mapping))
    
    print("\n--- ROLES ---")
    res = conn.execute(text("SELECT id, name FROM admin_roles"))
    for row in res:
        print(dict(row._mapping))
