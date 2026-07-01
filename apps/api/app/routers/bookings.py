from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from app.models import Booking, User, ProviderProfile, WalletTransaction
from uuid import UUID
from typing import List
import random
import json
from datetime import datetime
from pydantic import BaseModel
from app.websocket import manager

class OtpVerifyRequest(BaseModel):
    otp: str

router = APIRouter()

# Helper function to route and assign booking based on smart ranking
def find_and_assign_provider(booking: Booking, db: Session) -> bool:
    from app.seed import CITIES_COORDINATES
    
    # 1. Detect city from booking address
    city = "Kanpur"
    for c in CITIES_COORDINATES:
        if c.lower() in booking.address.lower():
            city = c
            break
            
    # 2. Get existing rejected providers list
    try:
        rejected_ids = json.loads(booking.rejected_providers or "[]")
    except:
        rejected_ids = []
        
    # 3. Find approved, available providers in this city & category
    query = db.query(User, ProviderProfile).join(
        ProviderProfile, User.id == ProviderProfile.user_id
    ).filter(
        User.role == "PROVIDER",
        User.status == "APPROVED",
        ProviderProfile.category == booking.service_type,
        ProviderProfile.city == city,
        ProviderProfile.is_available == True
    )
    
    candidates = query.all()
    
    # Fallback to category only if city-wide matches are empty
    if not candidates:
        query = db.query(User, ProviderProfile).join(
            ProviderProfile, User.id == ProviderProfile.user_id
        ).filter(
            User.role == "PROVIDER",
            ProviderProfile.category == booking.service_type
        )
        candidates = query.all()

    # Filter out already rejected providers
    candidates = [c for c in candidates if str(c[0].id) not in rejected_ids]
    
    # DISPATCH LOGIC:
    # "IF original professional exists -> assign to original. ELSE assign to xatyammishra07@gmail.com"
    original_candidates = []
    testing_candidate = None
    for u, p in candidates:
        email = u.email.lower()
        if email == "xatyammishra07@gmail.com":
            testing_candidate = (u, p)
        elif not email.endswith("@homesphere.com"):
            original_candidates.append((u, p))
            
    if original_candidates:
        candidates = original_candidates
    else:
        if testing_candidate:
            candidates = [testing_candidate]
        else:
            satyam_user = db.query(User).filter(User.email.ilike("xatyammishra07@gmail.com")).first()
            if satyam_user:
                profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == satyam_user.id).first()
                if not profile:
                    profile = ProviderProfile(
                        user_id=satyam_user.id,
                        category=booking.service_type,
                        experience_yrs=5,
                        is_verified=True,
                        is_available=True,
                        rating=4.8,
                        city="Kanpur",
                        latitude=26.4499,
                        longitude=80.3319
                    )
                    db.add(profile)
                    db.commit()
                    db.refresh(profile)
                candidates = [(satyam_user, profile)]
            else:
                candidates = []
    
    if not candidates:
        booking.provider_id = None
        booking.status = "PENDING_PROVIDER_ACCEPTANCE"
        return False
        
    # 4. Score and Rank candidates
    cust_lat = booking.latitude or CITIES_COORDINATES.get(city, (26.4499, 80.3319))[0]
    cust_lng = booking.longitude or CITIES_COORDINATES.get(city, (26.4499, 80.3319))[1]
    
    scored_candidates = []
    for user_obj, profile in candidates:
        p_lat = profile.latitude or cust_lat
        p_lng = profile.longitude or cust_lng
        distance = ((p_lat - cust_lat) ** 2 + (p_lng - cust_lng) ** 2) ** 0.5 * 111.0 # approx km
        
        dist_score = max(0, 100 - (distance * 6.0))
        rating_score = (profile.rating / 5.0) * 100
        exp_score = min(100, (profile.experience_yrs / 15.0) * 100)
        price_score = max(0, 100 - (profile.hourly_rate / 1000.0) * 100)
        reliability = (profile.response_rate * 0.4) + (profile.success_rate * 0.6)
        
        premium_boost = 15.0 if profile.is_premium else 0.0
        
        match_score = (
            dist_score * 0.25 +
            rating_score * 0.25 +
            exp_score * 0.15 +
            price_score * 0.15 +
            reliability * 0.10 +
            premium_boost
        )
        scored_candidates.append((user_obj.id, match_score))
        
    scored_candidates.sort(key=lambda x: x[1], reverse=True)
    
    # Assign the top scored provider
    booking.provider_id = scored_candidates[0][0]
    booking.status = "PENDING_PROVIDER_ACCEPTANCE"
    return True

@router.post("/", response_model=BookingResponse)
async def create_booking(dto: BookingCreate, db: Session = Depends(get_db)):
    customer = db.query(User).filter(User.id == dto.customerId).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    try:
        # Initialize model
        booking = Booking(
            customer_id=dto.customerId,
            provider_id=dto.providerId,
            service_type=dto.serviceType,
            description=dto.description,
            address=dto.address,
            is_emergency=dto.isEmergency,
            labor_cost=dto.laborCost,
            material_cost=dto.materialCost,
            total_cost=dto.totalCost,
            duration_min=dto.durationMin,
            latitude=dto.latitude,
            longitude=dto.longitude,
            status="PENDING_PROVIDER_ACCEPTANCE",
            rejected_providers="[]",
            otp=str(random.randint(100000, 999999)) # Pre-generate 6 digit OTP code
        )

        db.add(booking)
        db.flush() # Flush to generate primary key ID
        
        # If no provider specified, invoke auto-routing
        if not booking.provider_id:
            find_and_assign_provider(booking, db)
            
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed: {str(e)}"
        )
        
    # Broadcast websocket events
    await manager.broadcast({
        "event": "booking_created",
        "booking_id": str(booking.id),
        "customer_id": str(booking.customer_id),
        "provider_id": str(booking.provider_id) if booking.provider_id else None,
        "status": booking.status
    })
    
    await manager.broadcast({
        "event": "booking_popup",
        "booking_id": str(booking.id),
        "customer_name": booking.customer_name,
        "customer_email": booking.customer_email,
        "provider_id": str(booking.provider_id) if booking.provider_id else None,
        "service_type": booking.service_type,
        "description": booking.description,
        "address": booking.address,
        "total_cost": booking.total_cost,
        "latitude": booking.latitude,
        "longitude": booking.longitude
    })
        
    return booking

@router.get("/", response_model=List[BookingResponse])
async def get_bookings(
    userId: str = Query(...),
    role: str = Query(...),
    db: Session = Depends(get_db)
):
    if isinstance(userId, UUID):
        user_uuid = userId
        user = db.query(User).filter(User.id == user_uuid).first()
    else:
        try:
            user_uuid = UUID(userId)
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            user = db.query(User).filter(User.firebase_uid == userId).first()
            if user:
                user_uuid = user.id
            else:
                return []
            
    if not user:
        return []

    if role == "PROVIDER":
        is_master_sim = user.email.lower() == "xatyammishra07@gmail.com"
        if is_master_sim:
            dummy_users_ids = db.query(User.id).filter(User.email.ilike("%@homesphere.com")).all()
            dummy_ids_list = [d[0] for d in dummy_users_ids]
            return db.query(Booking).options(joinedload(Booking.review)).filter(
                (Booking.provider_id == user_uuid) | 
                (Booking.provider_id.in_(dummy_ids_list))
            ).order_by(Booking.created_at.desc()).all()
        return db.query(Booking).options(joinedload(Booking.review)).filter(Booking.provider_id == user_uuid).order_by(Booking.created_at.desc()).all()
    return db.query(Booking).options(joinedload(Booking.review)).filter(Booking.customer_id == user_uuid).order_by(Booking.created_at.desc()).all()

@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: UUID,
    dto: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    if dto.status == "SERVICE_STARTED" and booking.status not in ["OTP_VERIFIED", "SERVICE_STARTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Starting the service requires OTP verification. Please verify the customer OTP first."
        )

    booking.status = dto.status
    if dto.techLat is not None:
        booking.tech_latitude = dto.techLat
    if dto.techLng is not None:
        booking.tech_longitude = dto.techLng
    if dto.etaMinutes is not None:
        booking.eta_minutes = dto.etaMinutes

    db.commit()
    db.refresh(booking)
    
    # Broadcast updates
    await manager.broadcast({
        "event": "booking_updated",
        "booking_id": str(booking.id),
        "status": booking.status,
        "tech_latitude": booking.tech_latitude,
        "tech_longitude": booking.tech_longitude,
        "eta_minutes": booking.eta_minutes
    })
    
    if booking.status == "ON_THE_WAY":
        await manager.broadcast({
            "event": "provider_departed",
            "booking_id": str(booking.id)
        })
    elif booking.status == "ARRIVED":
        await manager.broadcast({
            "event": "provider_arrived",
            "booking_id": str(booking.id)
        })
        
    return booking

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_details(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).options(joinedload(Booking.review)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking

@router.post("/{booking_id}/accept")
async def accept_booking(
    booking_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    if current_user.role == "PROVIDER":
        booking.provider_id = current_user.id
        
    booking.status = "ACCEPTED"
    if not booking.otp:
        booking.otp = str(random.randint(100000, 999999)) # Generate 6-digit OTP
        
    db.commit()
    db.refresh(booking)
    
    # Broadcast accept
    await manager.broadcast({
        "event": "booking_accepted",
        "booking_id": str(booking.id),
        "provider_id": str(booking.provider_id),
        "status": booking.status,
        "otp": booking.otp
    })
    
    return {"status": "SUCCESS", "message": "Booking request accepted.", "booking": booking}

@router.post("/{booking_id}/reject")
async def reject_booking(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    # Record the provider who rejected it
    try:
        rejected_ids = json.loads(booking.rejected_providers or "[]")
    except:
        rejected_ids = []
        
    if booking.provider_id:
        rejected_ids.append(str(booking.provider_id))
        
    booking.rejected_providers = json.dumps(rejected_ids)
    
    # Cascade to the next highest ranked provider
    find_and_assign_provider(booking, db)
    db.commit()
    db.refresh(booking)
    
    # Broadcast reject
    await manager.broadcast({
        "event": "booking_rejected",
        "booking_id": str(booking.id),
        "status": booking.status
    })
    
    return {"status": "SUCCESS", "message": "Booking rejected. Re-routed to the next candidate.", "booking": booking}

@router.post("/{booking_id}/ignore")
async def ignore_booking(booking_id: UUID, db: Session = Depends(get_db)):
    return await reject_booking(booking_id, db)

@router.get("/{booking_id}/otp")
async def get_booking_otp(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or not booking.otp:
        raise HTTPException(status_code=404, detail="No active OTP code found.")
    return {"otp": booking.otp}

@router.post("/{booking_id}/send-otp")
async def send_booking_otp(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    otp = str(random.randint(100000, 999999))
    booking.otp = otp
    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"OTP verification code sent to customer.",
        "otp": otp
    }

@router.post("/{booking_id}/verify-otp")
async def verify_booking_otp(booking_id: UUID, payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if not booking.otp:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new verification code.")
        
    if booking.otp != payload.otp:
        raise HTTPException(status_code=400, detail="Incorrect verification OTP code. Please try again.")
        
    booking.status = "OTP_VERIFIED"
    booking.otp_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    
    # Broadcast OTP verified
    await manager.broadcast({
        "event": "otp_verified",
        "booking_id": str(booking.id),
        "status": booking.status
    })
    
    return {"status": "SUCCESS", "message": "OTP verified successfully.", "bookingStatus": booking.status}

@router.post("/{booking_id}/start-service")
async def start_service(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    booking.status = "SERVICE_STARTED"
    db.commit()
    db.refresh(booking)
    
    # Broadcast service started
    await manager.broadcast({
        "event": "service_started",
        "booking_id": str(booking.id),
        "status": booking.status
    })
    
    return {"status": "SUCCESS", "message": "Service has started.", "bookingStatus": booking.status}

@router.post("/{booking_id}/confirm-completion")
async def confirm_booking_completion(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    if booking.payment_status == "PAID":
        booking.status = "PAYMENT_COMPLETED"
        if booking.provider_id:
            wallet_tx = WalletTransaction(
                user_id=booking.provider_id,
                amount=booking.total_cost,
                type="CREDIT",
                reference=f"Payout for Booking {booking.id}"
            )
            db.add(wallet_tx)
    else:
        booking.status = "SERVICE_COMPLETED"
            
    db.commit()
    db.refresh(booking)
    
    # Broadcast completion
    await manager.broadcast({
        "event": "service_completed",
        "booking_id": str(booking.id),
        "status": booking.status
    })
    
    return {"status": "SUCCESS", "message": "Job completion confirmed.", "bookingStatus": booking.status}

class SubmitReviewRequest(BaseModel):
    rating: int
    comment: str

@router.post("/{booking_id}/review")
async def submit_booking_review(booking_id: UUID, req: SubmitReviewRequest, db: Session = Depends(get_db)):
    from app.models import Review
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    existing = db.query(Review).filter(Review.booking_id == booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted for this booking.")
        
    from app.routers.reviewer import analyze_review, ReviewAnalysisRequest
    analysis = analyze_review(ReviewAnalysisRequest(review_text=req.comment, rating=req.rating))
    
    review = Review(
        booking_id=booking_id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        rating=req.rating,
        comment=req.comment,
        is_flagged=analysis.is_flagged,
        ai_sentiment=analysis.sentiment_score
    )
    db.add(review)
    
    if booking.provider_id:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == booking.provider_id).first()
        if profile:
            all_ratings = db.query(Review.rating).filter(Review.provider_id == booking.provider_id).all()
            ratings_list = [r[0] for r in all_ratings] + [req.rating]
            profile.rating = round(sum(ratings_list) / len(ratings_list), 2)
            
    db.commit()
    
    # Broadcast review
    await manager.broadcast({
        "event": "review_submitted",
        "booking_id": str(booking_id),
        "rating": req.rating,
        "comment": req.comment
    })
    
    return {
        "status": "SUCCESS", 
        "message": "Review submitted and analyzed successfully.", 
        "is_flagged": review.is_flagged,
        "ai_sentiment": review.ai_sentiment,
        "flag_reason": analysis.reason
    }
