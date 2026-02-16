from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# construct path to .env file explicitly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Get database connection from environment variables
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"
)

# Log the database URL (masked) for debugging
if SQLALCHEMY_DATABASE_URL:
    masked_url = SQLALCHEMY_DATABASE_URL
    if "@" in masked_url:
        part1, part2 = masked_url.split("@")
        masked_url = f"{part1.split(':')[0]}:****@{part2}"
    print(f"[DB] Loaded DATABASE_URL: {masked_url}")

# Create engine with connection pooling for PostgreSQL/Supabase
if "postgresql" in SQLALCHEMY_DATABASE_URL or "supabase" in SQLALCHEMY_DATABASE_URL:
    # PostgreSQL/Supabase-specific configuration
    # Using NullPool to prevent connection exhaustion on Supabase free tier
    # Each request gets a fresh connection that's immediately closed
    from sqlalchemy.pool import NullPool
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool,  # No connection pooling - fresh connection per request
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
