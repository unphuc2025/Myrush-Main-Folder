import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Check columns
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_courts' ORDER BY ordinal_position")
columns = cur.fetchall()
print('Columns in admin_courts:')
for col in columns:
    print(f'  - {col[0]}')

# Check sample data
cur.execute('SELECT id, name, branch_id, game_type_id FROM admin_courts LIMIT 3')
rows = cur.fetchall()
print('\nSample data:')
for r in rows:
    print(f'  ID: {r[0]}, Name: {r[1]}, Branch: {r[2]}, GameType: {r[3]}')

cur.close()
conn.close()
