import os
import psycopg2
from dotenv import load_dotenv

# Load env from .env file
load_dotenv('unified-backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')
print(f"[DB] Loaded DATABASE_URL")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Query to check if bookings joined with courts return logic_type
    query = """
        SELECT b.id, c.name, c.logic_type 
        FROM booking b
        LEFT JOIN admin_courts c ON b.court_id::text = c.id::text
        LIMIT 5
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    
    print("\nVerification Results:")
    print("-" * 50)
    for row in rows:
        print(f"Booking ID: {row[0]}")
        print(f"Court Name: {row[1]}")
        print(f"Logic Type: {row[2]}")
        print("-" * 50)
    
    cur.close()
    conn.close()
    print("Verification complete.")

except Exception as e:
    print(f"Error during verification: {e}")
