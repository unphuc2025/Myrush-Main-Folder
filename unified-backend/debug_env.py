
import os
from dotenv import load_dotenv

# Try to load .env
load_dotenv()

# Get DATABASE_URL
db_url = os.getenv("DATABASE_URL")

print(f"DATABASE_URL from env: {db_url}")

if not db_url:
    print("WARNING: DATABASE_URL not found in environment.")
else:
    # Mask password for security
    if "@" in db_url:
        part1, part2 = db_url.split("@")
        if ":" in part1:
            user_pass = part1.split("//")[1]
            if ":" in user_pass:
                u, p = user_pass.split(":")
                masked_part1 = part1.replace(p, "****")
                print(f"Loaded URL: {masked_part1}@{part2}")
            else:
                print(f"Loaded URL: {part1}@{part2}")
        else:
             print(f"Loaded URL: {part1}@{part2}")
    else:
        print(f"Loaded URL: {db_url}")

from database import SQLALCHEMY_DATABASE_URL
print(f"SQLALCHEMY_DATABASE_URL from database.py: {SQLALCHEMY_DATABASE_URL}")

print("\n[TEST] Attempting database connection...")
try:
    from sqlalchemy import text
    from database import engine
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("[SUCCESS] Database connection successful! (SELECT 1 returned)")
except Exception as e:
    print(f"[FAILURE] Database connection failed: {e}")

