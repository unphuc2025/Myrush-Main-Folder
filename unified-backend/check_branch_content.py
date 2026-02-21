from sqlalchemy import text
from database import engine

def check_branch_data():
    with engine.connect() as conn:
        print("\n--- Branch Terms and Amenities Content ---")
        try:
            # Check terms
            result = conn.execute(text("SELECT id, name, terms_condition, rule FROM admin_branches WHERE terms_condition IS NOT NULL OR rule IS NOT NULL LIMIT 5"))
            rows = result.fetchall()
            print(f"Branches with terms: {len(rows)}")
            for row in rows:
                print(f"ID: {row.id}, Name: {row.name}")
                print(f"  Terms: {row.terms_condition}")
                print(f"  Rule: {row.rule}")
            
            # Check amenities association
            result = conn.execute(text("SELECT branch_id, COUNT(*) FROM admin_branch_amenities GROUP BY branch_id"))
            rows = result.fetchall()
            print(f"\nBranches with amenities association: {len(rows)}")
            for row in rows:
                print(f"  Branch ID: {row.branch_id}, Amenity Count: {row.count}")

            # Check if there are any amenities at all
            result = conn.execute(text("SELECT id, name FROM admin_amenities LIMIT 5"))
            rows = result.fetchall()
            print(f"\nAmenities table content (first 5):")
            for row in rows:
                print(f"  ID: {row.id}, Name: {row.name}")

        except Exception as e:
            print(f"Error checking branch data: {e}")

if __name__ == "__main__":
    check_branch_data()
