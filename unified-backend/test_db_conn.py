
import os
import psycopg2
from urllib.parse import urlparse

# DATABASE_URL from .env
db_url = "postgresql://postgres:Tfz9FMhOx3AvkO1W@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"

print(f"Testing connection to: {db_url.split('@')[1]}")

try:
    conn = psycopg2.connect(db_url)
    print("SUCCESS: Connected to the database!")
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("SUCCESS: Executed SELECT 1")
    cur.close()
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")
