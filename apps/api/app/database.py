from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import os

db_url = settings.DATABASE_URL or "sqlite:///./homesphere.db"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Test database connection and handle fallback
try:
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    # Quick connectivity test
    with engine.connect() as conn:
        print(f"Database connection successful: {db_url}")
except Exception as e:
    print(f"Warning: Primary database connection failed ({str(e)}). Falling back to SQLite local database.")
    db_url = "sqlite:///./homesphere.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to yield database sessions to API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
