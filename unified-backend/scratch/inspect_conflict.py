import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('unified-backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Query the conflicting booking
    cur.execute("""
        SELECT b.id, b.user_id, u.email, b.court_id, b.booking_date, b.start_time, b.end_time, b.status, b.payment_status, b.logic_type
        FROM booking b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN admin_courts c ON b.court_id = c.id
        WHERE b.booking_display_id = 'BK-MNF0V0'
    """)
    row = cur.fetchone()
    
    if row:
        print("\nConflicting Booking Details:")
        print(f"ID: {row[0]}")
        print(f"User Email: {row[2]}")
        print(f"Court: {row[3]}")
        print(f"Date: {row[4]}")
        print(f"Time: {row[5]} - {row[6]}")
        print(f"Status: {row[7]} / {row[8]}")
    else:
        print("\nBooking BK-MNF0V0 not found.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
