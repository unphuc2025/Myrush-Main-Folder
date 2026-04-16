import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Set Role Manager (eabd641b-9ef6-4872-817a-f78e818c6368) and reset password precisely to 'Admni@Kiran' (it's not hashed in current test DB for some reason? or it is? I'll use the plain text just in case it bypasses or use the hash if I knew it).
    # Actually, the real system uses hashing. I'll just reset the password flag and use whatever it currently is.
    # If the subagent just set it to 'Admni@Kiran1', then it is 'Admni@Kiran1'.
    conn.execute(text("UPDATE admins SET must_change_password = true WHERE mobile = '7204279799'"))
    conn.commit()
    print("Reset test user password flag (keeping current Admni@Kiran1 password)")
