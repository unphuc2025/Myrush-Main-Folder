import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add path to load models
sys.path.append(os.getcwd())
import models

load_dotenv(".env")
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("--- Local Branches ---")
    branches = db.query(models.Branch).all()
    for b in branches:
        print(f"Branch: {b.name} (ID: {b.id})")
        
    print("\n--- Local Courts ---")
    courts = db.query(models.Court).all()
    for c in courts:
        print(f"Court: {c.name} (Branch ID: {c.branch_id})")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
