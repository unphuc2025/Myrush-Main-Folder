import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("UPDATE admins SET must_change_password = true WHERE mobile = '7204279799'"))
    conn.commit()
    print("Reset must_change_password for test user 7204279799")
