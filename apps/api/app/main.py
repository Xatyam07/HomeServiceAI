import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.seed import seed_data
from app.routers import auth, bookings, diagnosis, estimator, matching, reviewer, admin, payments

# Auto-create database tables on launch (SQLite/Postgres)
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
except Exception as e:
    print(f"Database table initialization/seeding failed: {str(e)}")

app = FastAPI(
    title="HomeSphere AI - API Gateway & Core Services",
    version="1.0.0",
    description="Unified Backend Engine hosting AI Problem Diagnosis, Booking Pipelines, smart matching scoring, and Firebase RBAC authentication."
)

# Enable CORS for NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Suite"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

# AI Routers
app.include_router(diagnosis.router, prefix="/api/ai/diagnose", tags=["AI Diagnosis"])
app.include_router(estimator.router, prefix="/api/ai/estimate", tags=["AI Estimator"])
app.include_router(matching.router, prefix="/api/ai/match", tags=["AI Matching"])
app.include_router(reviewer.router, prefix="/api/ai/review", tags=["AI Reviewer"])

@app.get("/")
def read_root():
    return {"status": "online", "service": "HomeSphere AI Unified Backend Services"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
