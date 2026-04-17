from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check current columns
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='push_tokens' AND table_schema='public' "
        "ORDER BY ordinal_position"
    ))
    cols = [r[0] for r in result.fetchall()]
    print(f"Current columns: {cols}")
    
    if 'admin_id' not in cols:
        print("admin_id is MISSING. Adding it now...")
        conn.execute(text(
            "ALTER TABLE public.push_tokens "
            "ADD COLUMN admin_id UUID REFERENCES admins(id) ON DELETE CASCADE"
        ))
        conn.commit()
        print("DONE: admin_id added successfully.")
    else:
        print("admin_id already exists - column is present.")
