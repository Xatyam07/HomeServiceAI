from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PaymentRecord, Booking, User
from pydantic import BaseModel
from uuid import UUID
import random
from typing import List

router = APIRouter()

class OrderCreateRequest(BaseModel):
    booking_id: UUID
    user_id: UUID
    amount: float

class PaymentVerifyRequest(BaseModel):
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    signature: str

@router.post("/order")
def create_test_order(dto: OrderCreateRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == dto.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Simulate Razorpay order id
    order_id = f"order_test_{random.randint(100000000, 999999999)}"
    
    # Store record
    record = PaymentRecord(
        user_id=dto.user_id,
        booking_id=dto.booking_id,
        razorpay_order_id=order_id,
        amount=dto.amount,
        status="CREATED"
    )
    db.add(record)
    db.commit()

    return {
        "id": order_id,
        "amount": dto.amount * 100, # In paise for Razorpay
        "currency": "INR",
        "status": "created"
    }

@router.post("/verify")
def verify_test_payment(dto: PaymentVerifyRequest, db: Session = Depends(get_db)):
    record = db.query(PaymentRecord).filter(PaymentRecord.razorpay_order_id == dto.razorpay_order_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Order record not found.")

    # Update payment state
    record.status = "CAPTURED"
    record.razorpay_payment_id = dto.razorpay_payment_id
    record.signature = dto.signature

    # Update associated booking
    booking = db.query(Booking).filter(Booking.id == dto.booking_id).first()
    if booking:
        booking.status = "PAYMENT_SUCCESSFUL"
        booking.payment_status = "PAID"

    db.commit()
    return {"status": "success", "message": "Razorpay signature verified successfully."}

@router.post("/refund/{payment_id}")
def process_test_refund(payment_id: UUID, db: Session = Depends(get_db)):
    record = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    record.status = "REFUNDED"
    booking = db.query(Booking).filter(Booking.id == record.booking_id).first()
    if booking:
        booking.payment_status = "REFUNDED"

    db.commit()
    return {"status": "success", "message": "Refund processed in test mode."}

@router.get("/history")
def get_payment_history(userId: UUID, db: Session = Depends(get_db)):
    records = db.query(PaymentRecord).filter(PaymentRecord.user_id == userId).all()
    history = []
    for r in records:
        booking = db.query(Booking).filter(Booking.id == r.booking_id).first()
        history.append({
            "id": str(r.id),
            "amount": r.amount,
            "status": r.status,
            "orderId": r.razorpay_order_id,
            "paymentId": r.razorpay_payment_id,
            "service": booking.service_type if booking else "Unknown",
            "date": r.created_at.strftime("%Y-%m-%d %I:%M %p")
        })
    return history
