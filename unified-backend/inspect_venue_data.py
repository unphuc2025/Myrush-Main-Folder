import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def inspect_data():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    print("--- ADMIN_COURTS ---")
    cur.execute("SELECT id, name, images, amenities, terms_and_conditions FROM admin_courts LIMIT 5")
    courts = cur.fetchall()
    for court in courts:
        print(f"ID: {court['id']}, Name: {court['name']}")
        print(f"  Images: {court['images']} (Type: {type(court['images'])})")
        print(f"  Amenities: {court['amenities']} (Type: {type(court['amenities'])})")
        tc = court['terms_and_conditions']
        print(f"  T&C: {tc[:50] + '...' if tc else 'None'}")

    print("\n--- ADMIN_BRANCHES ---")
    cur.execute("SELECT id, name, images, opening_hours, terms_condition, search_location, ground_overview FROM admin_branches LIMIT 3")
    branches = cur.fetchall()
    for branch in branches:
        print(f"ID: {branch['id']}, Name: {branch['name']}")
        print(f"  Images: {branch['images']} (Type: {type(branch['images'])})")
        print(f"  Opening Hours: {branch['opening_hours']} (Type: {type(branch['opening_hours'])})")
        tc = branch['terms_condition']
        print(f"  T&C: {tc[:50] + '...' if tc else 'None'}")
        print(f"  Search Location: {branch['search_location']}")
        print(f"  Ground Overview: {branch['ground_overview']}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_data()
