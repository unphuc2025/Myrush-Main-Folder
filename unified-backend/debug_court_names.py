import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Query to match what the backend does
venue_id = "59f712a2-4db3-93bb-0b14f1c7b15e"
game_type = "Box Cricket"

query = """
    SELECT 
        ac.id, 
        ac.name,
        ac.price_per_hour, 
        agt.name as game_type
    FROM admin_courts ac
    JOIN admin_game_types agt ON ac.game_type_id = agt.id
    WHERE ac.branch_id = %s AND ac.is_active = true
    AND agt.name ILIKE %s
"""

cur.execute(query, (venue_id, f"%{game_type}%"))
rows = cur.fetchall()

print(f"Courts for venue {venue_id} with game type '{game_type}':")
print(f"Found {len(rows)} courts\n")

for row in rows:
    print(f"Court ID: {row[0]}")
    print(f"Court Name: '{row[1]}'")
    print(f"Price: {row[2]}")
    print(f"Game Type: {row[3]}")
    print("-" * 50)

cur.close()
conn.close()
