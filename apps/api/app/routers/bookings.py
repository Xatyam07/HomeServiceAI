from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from app.models import Booking, User
from uuid import UUID
from typing import List

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
