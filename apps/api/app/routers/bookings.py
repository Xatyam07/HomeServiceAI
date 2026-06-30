from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from app.models import Booking, User
from uuid import UUID
from typing import List
import time
import random
from pydantic import BaseModel

class OtpVerifyRequest(BaseModel):
    otp: str

booking_otps = {}

router = APIRouter()

@router.post("/", response_model=BookingResponse)
def create_booking(dto: BookingCreate, db: Session = Depends(get_db)):
    # Verify customer exists
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
        longitude=dto.longitude
    )

    db.add(booking)
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
        return db.query(Booking).filter(Booking.provider_id == userId).all()
    return db.query(Booking).filter(Booking.customer_id == userId).all()

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

    # Update columns
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

@router.get("/{booking_id}/otp")
def get_booking_otp(booking_id: UUID):
    otp_data = booking_otps.get(str(booking_id))
    if not otp_data:
        raise HTTPException(status_code=404, detail="No active OTP code found.")
    return {"otp": otp_data["otp"]}

@router.post("/{booking_id}/send-otp")
def send_booking_otp(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    otp = str(random.randint(100000, 999999))
    booking_otps[str(booking_id)] = {
        "otp": otp,
        "expires_at": time.time() + 600
    }
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
    
    otp_data = booking_otps.get(str(booking_id))
    if not otp_data:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new verification code.")
    
    if time.time() > otp_data["expires_at"]:
        booking_otps.pop(str(booking_id), None)
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")
        
    if otp_data["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Incorrect verification OTP code. Please try again.")
        
    booking.status = "IN_PROGRESS"
    db.commit()
    db.refresh(booking)
    
    booking_otps.pop(str(booking_id), None)
    return {"status": "SUCCESS", "message": "OTP verified successfully. Job has commenced.", "bookingStatus": booking.status}

@router.post("/{booking_id}/confirm-completion")
def confirm_booking_completion(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    booking.status = "PAYMENT_SUCCESSFUL"
    booking.payment_status = "PAID"
    
    if booking.provider_id:
        from app.models import WalletTransaction
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
