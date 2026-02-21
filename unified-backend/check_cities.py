import sys
import io
import os

# Force UTF-8 for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from database import SessionLocal
from models import City, Branch

def check_data():
    db = SessionLocal()
    try:
        with open("city_debug_direct.txt", "w", encoding="utf-8") as f:
            f.write("--- CITIES ---\n")
            cities = db.query(City).all()
            if not cities:
                f.write("No cities found in admin_cities table.\n")
            for c in cities:
                try:
                    status = "Active" if c.is_active else "Inactive"
                    f.write(f"ID: {c.id}, Name: {c.name}, Code: {c.short_code}, Status: {status}\n")
                except Exception as e:
                    f.write(f"Error printing city {c.id}: {e}\n")
            
            f.write("\n--- BRANCHES ---\n")
            branches = db.query(Branch).all()
            if not branches:
                f.write("No branches found in admin_branches table.\n")
            for b in branches:
                try:
                    city_name = b.city.name if b.city else "NO CITY"
                    status = "Active" if b.is_active else "Inactive"
                    f.write(f"({city_name}) Branch: {b.name}, Status: {status}\n")
                except Exception as e:
                    f.write(f"Error printing branch {b.id}: {e}\n")

            print("Data written to city_debug_direct.txt")

    except Exception as e:
        print(f"Error querying data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
