from sqlalchemy import text, inspect
from database import engine

def migrate():
    inspector = inspect(engine)
    existing_columns = [c['name'] for c in inspector.get_columns('admin_branches')]
    print(f"Existing columns: {existing_columns}")
    
    with engine.connect() as conn:
        print("Starting migration for admin_branches table...")
        
        # Helper to add column if missing
        def add_column_if_missing(column_name, column_type):
            if column_name not in existing_columns:
                try:
                    conn.execute(text(f"ALTER TABLE admin_branches ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"Added {column_name} column.")
                except Exception as e:
                    print(f"Error adding {column_name}: {e}")
            else:
                print(f"Column {column_name} already exists.")

        add_column_if_missing("terms_condition", "TEXT")
        add_column_if_missing("rule", "TEXT")
        add_column_if_missing("location_url", "TEXT")
        add_column_if_missing("videos", "TEXT[]")

        print("Migration completed.")

if __name__ == "__main__":
    migrate()
