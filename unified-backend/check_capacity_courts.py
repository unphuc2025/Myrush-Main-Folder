import database, models, sqlalchemy
from sqlalchemy import text

db = next(database.get_db())

# Check for any courts with capacity logic type
print("Checking all capacity-based courts:")
query = text("SELECT ac.name, ac.logic_type, agt.name as game_type, ac.is_active FROM admin_courts ac JOIN admin_game_types agt ON ac.game_type_id = agt.id WHERE ac.logic_type = 'capacity'")
results = db.execute(query).fetchall()

if not results:
    print("No capacity-based courts found.")
else:
    for row in results:
        print(f"Court: {row[0]} | Logic: {row[1]} | Sport: {row[2]} | Active: {row[3]}")

# Check for courts that might have Badminton or Cricket and capacity logic
print("\nChecking specifically for Badminton/Cricket with capacity logic:")
query = text("SELECT ac.name, ac.logic_type, agt.name as game_type FROM admin_courts ac JOIN admin_game_types agt ON ac.game_type_id = agt.id WHERE (agt.name ILIKE '%Badminton%' OR agt.name ILIKE '%Cricket%') AND ac.logic_type = 'capacity'")
results = db.execute(query).fetchall()

if not results:
    print("No Badminton/Cricket capacity-based courts found.")
else:
    for row in results:
        print(f"Court: {row[0]} | Logic: {row[1]} | Sport: {row[2]}")
