#!/usr/bin/env python3
import sys
import os
sys.path.append('.')

from routers.playo import fetch_availability
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from dotenv import load_dotenv

load_dotenv()

def test_get_courts():
    engine = create_engine(os.getenv('DATABASE_URL'))
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        result = fetch_availability('1', '1', '2025-01-26', db, None)
        print('Result:', result)
    except Exception as e:
        print('Error:', e)
    finally:
        db.close()

if __name__ == '__main__':
    test_get_courts()