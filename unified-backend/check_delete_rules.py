from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    query = text("""
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND rc.unique_constraint_name IN (
            SELECT constraint_name FROM information_schema.table_constraints 
            WHERE table_name = 'admin_courts' AND constraint_type = 'PRIMARY KEY'
        );
    """)
    res = conn.execute(query)
    print("Delete Rules for references to 'admin_courts':")
    for row in res:
        print(f"Table: {row.table_name}, Column: {row.column_name}, Rule: {row.delete_rule}")
