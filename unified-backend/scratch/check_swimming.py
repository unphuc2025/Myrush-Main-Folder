import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Check court logic_type
    cur.execute("SELECT id, name, logic_type FROM admin_courts WHERE name ILIKE '%Swimming%'")
    courts = cur.fetchall()
    print("\nCourts found:")
    for c in courts:
        print(f"ID: {c[0]}, Name: {c[1]}, Logic: {c[2]}")
    
    # Check recent bookings for Swimming
    if courts:
        court_ids = [str(c[0]) for c in courts]
        cur.execute("SELECT id, court_id, number_of_players, status FROM booking WHERE court_id::text IN %s LIMIT 5", (tuple(court_ids),))
        bookings = cur.fetchall()
        print("\nRecent Swimming Bookings:")
        for b in bookings:
            print(f"ID: {b[0]}, CourtID: {b[1]}, Players: {b[2]}, Status: {b[3]}")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
