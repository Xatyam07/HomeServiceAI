from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from app.models import Booking, User, ProviderProfile, WalletTransaction
from uuid import UUID
from typing import List
import random
import json
from datetime import datetime
from pydantic import BaseModel

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
    
    if not candidates:
        # No available providers left
        booking.provider_id = None
        booking.status = "REQUESTED"
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
    booking.status = "ASSIGNED"
    return True

@router.post("/", response_model=BookingResponse)
def create_booking(dto: BookingCreate, db: Session = Depends(get_db)):
    customer = db.query(User).filter(User.id == dto.customerId).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

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
        status="REQUESTED",
        rejected_providers="[]",
        otp=str(random.randint(100000, 999999)) # Pre-generate 6 digit OTP code
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # If no provider specified, invoke auto-routing
    if not booking.provider_id:
        find_and_assign_provider(booking, db)
        db.commit()
        db.refresh(booking)
        
    return booking

@router.get("/", response_model=List[BookingResponse])
def get_bookings(
    userId: UUID = Query(...),
    role: str = Query(...),
    db: Session = Depends(get_db)
):
    if role == "PROVIDER":
        user = db.query(User).filter(User.id == userId).first()
        is_master_sim = user and user.email.lower() == "xatyammishra07@gmail.com"
        if is_master_sim:
            # Query IDs of all dummy professionals
            dummy_users_ids = db.query(User.id).filter(User.email.like("%@homesphere.com")).all()
            dummy_ids_list = [d[0] for d in dummy_users_ids]
            return db.query(Booking).filter(
                (Booking.provider_id == userId) | 
                (Booking.provider_id.in_(dummy_ids_list))
            ).order_by(Booking.created_at.desc()).all()
        return db.query(Booking).filter(Booking.provider_id == userId).order_by(Booking.created_at.desc()).all()
    return db.query(Booking).filter(Booking.customer_id == userId).order_by(Booking.created_at.desc()).all()

@router.put("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
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

    if dto.status == "IN_PROGRESS" and booking.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Starting the service requires OTP verification. Please verify the customer OTP instead."
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
    return booking

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_details(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking

@router.post("/{booking_id}/accept")
def accept_booking(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    booking.status = "ACCEPTED"
    if not booking.otp:
        booking.otp = str(random.randint(1000, 9999))
        
    db.commit()
    db.refresh(booking)
    return {"status": "SUCCESS", "message": "Booking request accepted.", "booking": booking}

@router.post("/{booking_id}/reject")
def reject_booking(booking_id: UUID, db: Session = Depends(get_db)):
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
    return {"status": "SUCCESS", "message": "Booking rejected. Re-routed to the next candidate.", "booking": booking}

@router.post("/{booking_id}/ignore")
def ignore_booking(booking_id: UUID, db: Session = Depends(get_db)):
    return reject_booking(booking_id, db)

@router.get("/{booking_id}/otp")
def get_booking_otp(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or not booking.otp:
        raise HTTPException(status_code=404, detail="No active OTP code found.")
    return {"otp": booking.otp}

@router.post("/{booking_id}/send-otp")
def send_booking_otp(booking_id: UUID, db: Session = Depends(get_db)):
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
def verify_booking_otp(booking_id: UUID, payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if not booking.otp:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new verification code.")
        
    if booking.otp != payload.otp:
        raise HTTPException(status_code=400, detail="Incorrect verification OTP code. Please try again.")
        
    booking.status = "IN_PROGRESS"
    booking.otp_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    
    return {"status": "SUCCESS", "message": "OTP verified successfully. Job has commenced.", "bookingStatus": booking.status}

@router.post("/{booking_id}/confirm-completion")
def confirm_booking_completion(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    booking.status = "COMPLETED"
    booking.payment_status = "PAID"
    
    if booking.provider_id:
        wallet_tx = WalletTransaction(
            user_id=booking.provider_id,
            amount=booking.total_cost,
            type="CREDIT",
            reference=f"Payout for Booking {booking.id}"
        )
        db.add(wallet_tx)
        
    db.commit()
    db.refresh(booking)
    return {"status": "SUCCESS", "message": "Job completion confirmed and payout released to technician.", "bookingStatus": booking.status}
