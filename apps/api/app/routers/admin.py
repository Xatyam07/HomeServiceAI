from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ProviderProfile, Booking, Review, PaymentRecord
from uuid import UUID
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

# 1. Admin Telemetry & Dashboard Stats
@router.get("/stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_customers = db.query(User).filter(User.role == "CUSTOMER").count()
    total_professionals = db.query(User).filter(User.role == "PROVIDER").count()
    pending_approvals = db.query(User).filter(User.role == "PROVIDER", User.status == "PENDING").count()
    active_pros = db.query(User).filter(User.role == "PROVIDER", User.status == "APPROVED").count()
    rejected_pros = db.query(User).filter(User.role == "PROVIDER", User.status == "REJECTED").count()
    
    # Financial metrics
    completed_bookings = db.query(Booking).filter(Booking.status == "COMPLETED").all()
    monthly_rev = sum(b.total_cost for b in completed_bookings)
    
    # Bookings count today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_bookings = db.query(Booking).filter(Booking.created_at >= today_start).count()
    
    # Recent Bookings list
    recent_bookings_objs = db.query(Booking).order_by(Booking.created_at.desc()).limit(5).all()
    recent_bookings = []
    for b in recent_bookings_objs:
        customer = db.query(User).filter(User.id == b.customer_id).first()
        recent_bookings.append({
            "id": str(b.id),
            "customer": customer.name if customer else "Unknown",
            "service": b.service_type,
            "status": b.status,
            "totalCost": b.total_cost,
            "time": b.created_at.strftime("%I:%M %p")
        })

    # Recent Payments list
    recent_payments_objs = db.query(PaymentRecord).order_by(PaymentRecord.created_at.desc()).limit(5).all()
    recent_payments = []
    for p in recent_payments_objs:
        user = db.query(User).filter(User.id == p.user_id).first()
        recent_payments.append({
            "id": str(p.id),
            "customer": user.name if user else "Unknown",
            "amount": p.amount,
            "status": p.status,
            "orderId": p.razorpay_order_id
        })

    # Dummy Complaints
    complaints = [
        {"id": "COMP-01", "customer": "Kunal Sen", "issue": "AC Technician delayed by 45 minutes", "status": "OPEN"},
        {"id": "COMP-02", "customer": "Aarav Mehta", "issue": "Billing double-charge on material cost", "status": "RESOLVED"}
    ]

    return {
        "counters": {
            "totalUsers": total_users,
            "totalCustomers": total_customers,
            "totalProfessionals": total_professionals,
            "pendingApprovals": pending_approvals,
            "activeProfessionals": active_pros,
            "rejectedApplications": rejected_pros,
            "todayBookings": today_bookings,
            "monthlyRevenue": monthly_rev
        },
        "recentBookings": recent_bookings,
        "recentPayments": recent_payments,
        "complaints": complaints
    }

# 2. List Pending/All Professionals for Verification View
@router.get("/workers", response_model=List[Dict[str, Any]])
def list_workers(
    status_filter: str = Query(None), # PENDING, APPROVED, SUSPENDED
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "PROVIDER")
    if status_filter:
        query = query.filter(User.status == status_filter)
    
    workers = query.all()
    results = []
    for w in workers:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == w.id).first()
        results.append({
            "id": str(w.id),
            "name": w.name,
            "email": w.email,
            "phone": w.phone,
            "status": w.status,
            "category": profile.category if profile else "Unspecified",
            "experienceYrs": profile.experience_yrs if profile else 0,
            "docs": {
                "aadhaar": profile.aadhaar_url if profile else None,
                "selfie": profile.selfie_url if profile else None,
                "certificate": profile.certificate_url if profile else None
            }
        })
    return results

# 3. Approve Worker
@router.put("/workers/{worker_id}/approve")
def approve_worker(worker_id: UUID, db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.role == "PROVIDER").first()
    if not worker:
        raise HTTPException(status_code=404, detail="Professional not found.")
    
    worker.status = "APPROVED"
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == worker.id).first()
    if profile:
        profile.is_verified = True
    
    db.commit()
    return {"status": "SUCCESS", "message": f"Professional {worker.name} approved and activated."}

# 4. Reject Worker
@router.put("/workers/{worker_id}/reject")
def reject_worker(worker_id: UUID, db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.role == "PROVIDER").first()
    if not worker:
        raise HTTPException(status_code=404, detail="Professional not found.")
    
    worker.status = "REJECTED"
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == worker.id).first()
    if profile:
        profile.is_verified = False
        profile.is_available = False
        
    db.commit()
    return {"status": "SUCCESS", "message": f"Professional {worker.name} application rejected."}

# 5. Suspend Worker
@router.put("/workers/{worker_id}/suspend")
def suspend_worker(worker_id: UUID, db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.role == "PROVIDER").first()
    if not worker:
        raise HTTPException(status_code=404, detail="Professional not found.")
    
    worker.status = "SUSPENDED"
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == worker.id).first()
    if profile:
        profile.is_available = False
        
    db.commit()
    return {"status": "SUCCESS", "message": f"Professional {worker.name} account suspended."}

# 6. Reactivate Worker
@router.put("/workers/{worker_id}/reactivate")
def reactivate_worker(worker_id: UUID, db: Session = Depends(get_db)):
    worker = db.query(User).filter(User.id == worker_id, User.role == "PROVIDER").first()
    if not worker:
        raise HTTPException(status_code=404, detail="Professional not found.")
    
    worker.status = "APPROVED"
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == worker.id).first()
    if profile:
        profile.is_available = True
        
    db.commit()
    return {"status": "SUCCESS", "message": f"Professional {worker.name} account reactivated."}
