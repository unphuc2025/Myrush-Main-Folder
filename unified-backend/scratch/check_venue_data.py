import sqlite3
import os

# Try to find the database file
db_path = r'c:\Users\Z BOOK\Downloads\New folder\Myrush-Main-Folder\unified-backend\database.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking active branches...")
    cursor.execute("SELECT id, name, is_active, city_id, area_id FROM admin_branches")
    branches = cursor.fetchall()
    print(f"Total branches: {len(branches)}")
    for b in branches:
        print(f"ID: {b[0]}, Name: {b[1]}, Active: {b[2]}, CityID: {b[3]}, AreaID: {b[4]}")
        
    print("\nChecking cities...")
    cursor.execute("SELECT id, name, is_active FROM admin_cities")
    cities = cursor.fetchall()
    print(f"Total cities: {len(cities)}")
    for c in cities:
        print(f"ID: {c[0]}, Name: {c[1]}, Active: {c[2]}")
        
    print("\nChecking areas...")
    cursor.execute("SELECT id, name, is_active FROM admin_areas")
    areas = cursor.fetchall()
    print(f"Total areas: {len(areas)}")
    for a in areas:
        print(f"ID: {a[0]}, Name: {a[1]}, Active: {a[2]}")
        
    conn.close()
