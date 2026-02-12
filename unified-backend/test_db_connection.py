from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Testing connection to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    print("Session created.")
    
    # Try a simple query
    result = db.execute(text("SELECT 1"))
    print(f"Query result: {result.scalar()}")
    
    db.close()
    print("Connection successful!")
except Exception as e:
    print(f"Connection failed: {e}")
