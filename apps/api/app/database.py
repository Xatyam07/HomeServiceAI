from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import os

import time
from sqlalchemy.exc import OperationalError

db_url = settings.DATABASE_URL

if not db_url or not (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
    raise ValueError("DATABASE_URL environment variable must be set to a valid PostgreSQL connection string starting with postgresql:// or postgres://")

# Standardize postgres:// to postgresql:// for SQLAlchemy 1.4+ compatibility
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Retry database connections on startup
max_retries = 5
retry_interval = 2 # seconds
engine = None

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=2,
            pool_timeout=15,
            pool_recycle=1800
        )
        # Test the connection immediately
        with engine.connect() as conn:
            print(f"Database connection successful on attempt {attempt}: {db_url}")
            break
    except Exception as e:
        print(f"Database connection attempt {attempt} failed: {str(e)}")
        if attempt == max_retries:
            print("Max retries reached. Database connection failed. Aborting startup.")
            raise e
        time.sleep(retry_interval)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to yield database sessions to API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
