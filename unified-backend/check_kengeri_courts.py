import database, models, sqlalchemy
from sqlalchemy import text
db = database.SessionLocal()
query = text("SELECT id, name, logic_type FROM admin_courts WHERE branch_id = 'f4de87f7-dd91-4a74-beeb-8eeb9fb3f564'")
res = db.execute(query).fetchall()
for row in res:
    print(f"ID: {row[0]}, Name: {row[1]}, Logic: {row[2]}")
db.close()
