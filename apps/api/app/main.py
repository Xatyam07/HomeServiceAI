import uvicorn
import os
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
from app.seed import seed_data
from app.routers import auth, bookings, diagnosis, estimator, matching, reviewer, admin, payments, uploads

# Imports for health check
from sqlalchemy import text
import redis
import cloudinary
import cloudinary.api
import razorpay
from app.config import settings
from app.firebase import firebase_service

# Auto-create database tables on launch (SQLite/Postgres)
Base.metadata.create_all(bind=engine)
print("Database tables initialized successfully.")

def run_database_optimizations():
    print("Running database indexes optimization and data sanitization...")
    db = SessionLocal()
    try:
        # 1. Create indexes
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_provider_profiles_city_category ON provider_profiles(city, category)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)"))
        db.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_dummy_routed BOOLEAN DEFAULT FALSE"))
        db.commit()
        print("Indexes validated/created successfully.")

        pass
    except Exception as e:
        db.rollback()
        print(f"Error during database optimizations: {e}")
    finally:
        db.close()

run_database_optimizations()


app = FastAPI(
    title="HomeSphere AI - API Gateway & Core Services",
    version="1.0.0",
    description="Unified Backend Engine hosting AI Problem Diagnosis, Booking Pipelines, smart matching scoring, and Firebase RBAC authentication."
)

# Enable CORS for NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Core Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Suite"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])

# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        print("Cloudinary configured successfully during startup.")
    except Exception as e:
        print(f"Warning: Cloudinary configuration failed during startup: {e}")

# Setup relative static folders and auto-create them at startup
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
uploads_dir = os.path.join(static_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
print(f"Static folder mounted and verified at: {static_dir}")

# AI Routers
app.include_router(diagnosis.router, prefix="/api/ai/diagnose", tags=["AI Diagnosis"])
app.include_router(estimator.router, prefix="/api/ai/estimate", tags=["AI Estimator"])
app.include_router(matching.router, prefix="/api/ai/match", tags=["AI Matching"])
app.include_router(reviewer.router, prefix="/api/ai/review", tags=["AI Reviewer"])

@app.get("/")
def read_root():
    return {"status": "online", "service": "HomeSphere AI Unified Backend Services"}

from fastapi import WebSocket, WebSocketDisconnect
from app.websocket import manager
import json

@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("event") == "provider_location":
                    booking_id = msg.get("booking_id")
                    lat = msg.get("latitude")
                    lng = msg.get("longitude")
                    if booking_id:
                        db = SessionLocal()
                        try:
                            from app.models import Booking
                            from uuid import UUID
                            booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
                            if booking:
                                booking.tech_latitude = lat
                                booking.tech_longitude = lng
                                db.commit()
                        except Exception as db_err:
                            print(f"Error updating tech location in DB: {db_err}")
                        finally:
                            db.close()
                    await manager.broadcast({
                        "event": "provider_location",
                        "provider_id": user_id,
                        "latitude": lat,
                        "longitude": lng,
                        "booking_id": booking_id
                    })
            except Exception as json_err:
                print(f"Error parsing websocket frame from {user_id}: {json_err}")
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(user_id)

@app.get("/health")
def health_check(response: Response):
    # 1. Check PostgreSQL connection
    postgres_status = {"connected": False, "details": None}
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        postgres_status["connected"] = True
        postgres_status["details"] = "Connection successful"
    except Exception as e:
        postgres_status["details"] = str(e)
    finally:
        db.close()

    # 2. Check Redis connection
    redis_status = {"connected": False, "details": None}
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        r.ping()
        redis_status["connected"] = True
        redis_status["details"] = "Connection successful"
    except Exception as e:
        redis_status["details"] = str(e)

    # 3. Check Firebase connection
    firebase_status = {"connected": False, "details": None}
    if firebase_service.initialized:
        firebase_status["connected"] = True
        firebase_status["details"] = "Initialized successfully"
    else:
        firebase_status["details"] = "Warning: credentials missing or invalid"

    # 4. Check Cloudinary connection
    cloudinary_status = {"connected": False, "details": None}
    if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
        cloudinary_status["details"] = "Warning: credentials missing"
    else:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            res = cloudinary.api.ping()
            if res.get("status") == "ok":
                cloudinary_status["connected"] = True
                cloudinary_status["details"] = "Connection successful"
            else:
                cloudinary_status["details"] = f"Unexpected response: {res}"
        except Exception as e:
            cloudinary_status["details"] = str(e)

    # 5. Check Razorpay connection
    razorpay_status = {"connected": False, "details": None}
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        razorpay_status["details"] = "Warning: credentials missing"
    else:
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            client.order.all({"count": 1})
            razorpay_status["connected"] = True
            razorpay_status["details"] = "Connection successful"
        except Exception as e:
            razorpay_status["details"] = str(e)

    # Determine overall status: primary systems (PostgreSQL, Redis) must be online
    is_healthy = postgres_status["connected"] and redis_status["connected"]
    overall_status = "healthy" if is_healthy else "unhealthy"
    
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall_status,
        "services": {
            "postgres": postgres_status,
            "redis": redis_status,
            "firebase": firebase_status,
            "cloudinary": cloudinary_status,
            "razorpay": razorpay_status
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
