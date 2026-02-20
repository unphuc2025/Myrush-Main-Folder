
from database import SessionLocal
from sqlalchemy import text

def check_branch(branch_id):
    db = SessionLocal()
    try:
        print(f"Checking branch {branch_id}")
        query = text("SELECT id, name, is_active FROM admin_branches WHERE id = :id")
        res = db.execute(query, {"id": branch_id}).first()
        if res:
            print(f"Found: {res}")
            print(f"Type of ID: {type(res[0])}")
        else:
            print("Not found in admin_branches")
            
        print("Checking admin_courts for this ID...")
        query_court = text("SELECT id, name, branch_id FROM admin_courts WHERE id = :id")
        res_court = db.execute(query_court, {"id": branch_id}).first()
        if res_court:
             print(f"Found in admin_courts: {res_court}")
        else:
             print("Not found in admin_courts")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_branch('7c4eebf6-4b12-441e-9cee-762616eb4330')
