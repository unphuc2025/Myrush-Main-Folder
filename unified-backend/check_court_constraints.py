from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    query = text("""
        SELECT 
            conname AS constraint_name, 
            conrelid::regclass AS table_name 
        FROM pg_constraint 
        WHERE confrelid = 'admin_courts'::regclass
    """)
    res = conn.execute(query)
    print("Tables referencing 'admin_courts':")
    for row in res:
        print(f"Table: {row.table_name}, Constraint: {row.constraint_name}")
