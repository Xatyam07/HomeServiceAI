from sqlalchemy.orm import Session
from app.models import User, ProviderProfile, Booking, Review, WalletTransaction, PaymentRecord
import uuid
import random
from datetime import datetime, timedelta

def seed_data(db: Session):
    # 1. Check if database is already seeded
    if db.query(User).first() is not None:
        print("Database already contains data. Skipping seeding.")
        return

    print("Seeding database with initial HomeSphere AI data...")

    # 2. Seed Super Admin
    super_admin = User(
        id=uuid.uuid4(),
        email="9369022460sa@gmail.com",
        name="Super Admin",
        phone="+91 93690 22460",
        role="ADMIN",
        status="ACTIVE",
        firebase_uid="super_admin_firebase_uid_101"
    )
    db.add(super_admin)

    # 3. Seed Default Professional
    default_worker_id = uuid.uuid4()
    default_worker = User(
        id=default_worker_id,
        email="xatyammishra07@gmail.com",
        name="Satyam Mishra",
        phone="+91 98765 43210",
        role="PROVIDER",
        status="APPROVED",
        firebase_uid="worker_satyam_firebase_uid_707"
    )
    db.add(default_worker)

    default_worker_profile = ProviderProfile(
        id=uuid.uuid4(),
        user_id=default_worker_id,
        category="Plumber",
        experience_yrs=7,
        rating=4.95,
        is_available=True,
        is_verified=True,
        hourly_rate=450.0,
        success_rate=98.0,
        response_rate=96.0,
        aadhaar_url="https://res.cloudinary.com/homesphere/image/upload/v1/aadhaar.jpg",
        selfie_url="https://res.cloudinary.com/homesphere/image/upload/v1/satyam_selfie.jpg",
        bio="Certified pipeline technician specializing in commercial fittings, water joint sealants, and high-pressure clog removals.",
        city="Hyderabad",
        address="Flat 101, Srinivasa Residency, Madhapur, Hyderabad",
        skills="Leak Repair, Pipe Installation, Sump Cleaning",
        service_radius_km=15.0
    )
    db.add(default_worker_profile)

    # 4. Seed other Service Professionals across categories
    categories = [
        ("Electrician", "Amit Sharma", 6, 4.8, 350.0, "Certified board electrician. Short circuits, MCB replacement."),
        ("AC Repair Technician", "Suresh Kumar", 9, 4.9, 500.0, "AC compressor specialist and refrigerant coolant gas expert."),
        ("Painter", "Rajesh Varma", 8, 4.7, 300.0, "Waterproofing and interior wall premium paint finishes."),
        ("Pest Control Expert", "Vikas Singh", 5, 4.6, 600.0, "Eco-friendly termite, bug, and rodent eradication services."),
        ("Deep Cleaning Staff", "Pooja Patel", 4, 4.8, 800.0, "Full residential deep vacuum cleaning, bathroom sanitizer service."),
        ("Yoga Instructor", "Neha Gupta", 7, 4.9, 1200.0, "Certified Hatha and Vinyasa yoga trainer for private sessions."),
        ("Driver", "Sunil Yadav", 11, 4.92, 250.0, "Professional on-demand driver with 10+ years experience in city traffic."),
        ("Beautician", "Priya Das", 6, 4.85, 400.0, "Facials, waxing, threading, skin care therapies, and home spa."),
        ("CCTV Installer", "Rohan Mehta", 5, 4.75, 450.0, "Expert IP camera wiring, DVR, NVR setups, and smart home connectivity."),
        ("Carpenter", "Baldev Singh", 14, 4.9, 400.0, "Wooden door alignment, custom modular kitchen cabinets, sofa framework.")
    ]

    worker_users = []
    for cat, name, exp, rating, rate, bio in categories:
        w_id = uuid.uuid4()
        uid = f"worker_uid_{name.lower().replace(' ', '_')}"
        worker_user = User(
            id=w_id,
            email=f"{name.lower().replace(' ', '')}@homesphere.com",
            name=name,
            phone=f"+91 99000 {random.randint(10000, 99999)}",
            role="PROVIDER",
            status="APPROVED",
            firebase_uid=uid
        )
        db.add(worker_user)
        worker_users.append(worker_user)

        profile = ProviderProfile(
            id=uuid.uuid4(),
            user_id=w_id,
            category=cat,
            experience_yrs=exp,
            rating=rating,
            is_available=True,
            is_verified=True,
            hourly_rate=rate,
            success_rate=95.0 + random.random()*4,
            response_rate=92.0 + random.random()*7,
            bio=bio,
            city="Hyderabad",
            address=f"Secunderabad, Hyderabad",
            skills=f"{cat} Diagnostics, Joint fitting",
            service_radius_km=12.0
        )
        db.add(profile)

    # Add a pending worker to demonstrate approval flow
    pending_worker_id = uuid.uuid4()
    pending_worker = User(
        id=pending_worker_id,
        email="rahul.verma@example.com",
        name="Rahul Verma",
        phone="+91 98111 22233",
        role="PROVIDER",
        status="PENDING",
        firebase_uid="worker_pending_uid_999"
    )
    db.add(pending_worker)
    
    pending_profile = ProviderProfile(
        id=uuid.uuid4(),
        user_id=pending_worker_id,
        category="Electrician",
        experience_yrs=4,
        rating=5.0,
        is_available=False,
        is_verified=False,
        hourly_rate=300.0,
        aadhaar_url="https://res.cloudinary.com/homesphere/image/upload/v1/pending_aadhaar.pdf",
        selfie_url="https://res.cloudinary.com/homesphere/image/upload/v1/pending_selfie.jpg",
        bio="Domestic wiring wireman seeking approvals.",
        city="Hyderabad",
        address="Kondapur, Hyderabad"
    )
    db.add(pending_profile)

    # 5. Seed Customer profiles
    customers_data = [
        ("Kunal Sen", "kunal@gmail.com", "+91 98480 22338"),
        ("Ananya Rao", "ananya@gmail.com", "+91 88860 11223"),
        ("Aarav Mehta", "aarav@gmail.com", "+91 77760 99887"),
        ("Priya Reddy", "priya@gmail.com", "+91 91100 44556")
    ]

    customer_users = []
    for name, email, phone in customers_data:
        c_id = uuid.UUID("5300bfd4-1a2c-4977-9876-000000000001") if name == "Kunal Sen" else uuid.uuid4()
        c_user = User(
            id=c_id,
            email=email,
            name=name,
            phone=phone,
            role="CUSTOMER",
            status="ACTIVE",
            firebase_uid=f"customer_uid_{name.lower().replace(' ', '_')}"
        )
        db.add(c_user)
        customer_users.append(c_user)

    db.commit()

    # 6. Seed Booking Histories & Payments & Reviews
    # We will generate bookings for customers with our default approved worker (Satyam Mishra) and other workers
    booking_dates = [
        datetime.utcnow() - timedelta(days=12),
        datetime.utcnow() - timedelta(days=5),
        datetime.utcnow() - timedelta(days=1),
        datetime.utcnow()
    ]

    for idx, c_user in enumerate(customer_users):
        # Booking 1: Completed with review (Satyam Mishra)
        b1_id = uuid.uuid4()
        booking1 = Booking(
            id=b1_id,
            customer_id=c_user.id,
            provider_id=default_worker_id,
            service_type="Plumber",
            description="Leaky pipe under kitchen sink cabinet needs seal replacement.",
            status="COMPLETED",
            scheduled_time=booking_dates[0],
            labor_cost=450.0,
            material_cost=300.0,
            total_cost=750.0,
            address="Rainbow Residency, Hitec City, Hyderabad",
            payment_status="PAID"
        )
        db.add(booking1)

        # Review for Booking 1
        review1 = Review(
            id=uuid.uuid4(),
            booking_id=b1_id,
            customer_id=c_user.id,
            provider_id=default_worker_id,
            rating=5 if idx % 2 == 0 else 4,
            comment="Excellent work by Satyam! He resolved the leak quickly and cleaned the area after the job.",
            is_flagged=False,
            ai_sentiment=0.92
        )
        db.add(review1)

        # Transaction for Booking 1
        tx1 = WalletTransaction(
            id=uuid.uuid4(),
            user_id=default_worker_id,
            amount=750.0,
            type="CREDIT",
            reference=f"Job earnings: {b1_id}"
        )
        db.add(tx1)

        pay1 = PaymentRecord(
            id=uuid.uuid4(),
            user_id=c_user.id,
            booking_id=b1_id,
            razorpay_order_id=f"order_test_{random.randint(100000, 999999)}",
            razorpay_payment_id=f"pay_test_{random.randint(100000, 999999)}",
            amount=750.0,
            status="CAPTURED",
            signature="test_signature_xyz123"
        )
        db.add(pay1)

        # Booking 2: Active or Completed (Amit Sharma - Electrician)
        b2_id = uuid.uuid4()
        booking2 = Booking(
            id=b2_id,
            customer_id=c_user.id,
            provider_id=worker_users[0].id, # Amit Sharma
            service_type="Electrician",
            description="Bedroom fan wobbling and sparking on high speed.",
            status="IN_PROGRESS" if idx == 0 else "COMPLETED",
            scheduled_time=booking_dates[2],
            labor_cost=350.0,
            material_cost=0.0,
            total_cost=350.0,
            address=c_user.name + " residence, Hyderabad",
            payment_status="PAID" if idx != 0 else "PENDING"
        )
        db.add(booking2)

        if idx != 0:
            pay2 = PaymentRecord(
                id=uuid.uuid4(),
                user_id=c_user.id,
                booking_id=b2_id,
                razorpay_order_id=f"order_test_{random.randint(100000, 999999)}",
                razorpay_payment_id=f"pay_test_{random.randint(100000, 999999)}",
                amount=350.0,
                status="CAPTURED",
                signature="test_signature_abc789"
            )
            db.add(pay2)
            
            review2 = Review(
                id=uuid.uuid4(),
                booking_id=b2_id,
                customer_id=c_user.id,
                provider_id=worker_users[0].id,
                rating=4,
                comment="Fixed the wobbling. Decent electrician, polite behavior.",
                is_flagged=False,
                ai_sentiment=0.74
            )
            db.add(review2)

    db.commit()
    print("Database seeding completed successfully!")
