from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get database connection from environment variables
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"
)

# Create engine with connection pooling for PostgreSQL/Supabase
if "postgresql" in SQLALCHEMY_DATABASE_URL or "supabase" in SQLALCHEMY_DATABASE_URL:
    # PostgreSQL/Supabase-specific configuration with connection pooling
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,  # Maximum number of connections in pool
        max_overflow=10,  # Maximum overflow connections
        pool_timeout=30,  # Timeout for getting connection from pool
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_pre_ping=True,  # Check connection before using
        echo=False  # Disable SQL logging
    )
else:
    # Default engine for other databases
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get DB session"""
    db = None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        print(f"[DB] Error creating database session: {e}")
        raise
    finally:
        if db:
            try:
                db.close()
            except Exception as e:
                print(f"[DB] Error closing database session: {e}")

def is_db_available():
    """Check if database is available (for dev mode fallback)"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except:
        return False
