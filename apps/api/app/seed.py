from sqlalchemy.orm import Session
from app.models import User, ProviderProfile, Booking, Review, WalletTransaction, PaymentRecord, Invoice
import uuid
import random
from datetime import datetime, timedelta

def seed_data(db: Session):
    # 1. Check if database is already seeded
    if db.query(User).first() is not None:
        # Check if the test professional exists, seed if missing
        test_user = db.query(User).filter(User.email == "xatyammishra07@gmail.com").first()
        if not test_user:
            print("Seeding missing test professional account...")
            test_id = uuid.uuid4()
            test_prof = User(
                id=test_id,
                email="xatyammishra07@gmail.com",
                name="Satyam Mishra",
                phone="+91 98765 43210",
                role="PROVIDER",
                status="APPROVED",
                firebase_uid="worker_satyam_firebase_uid_707"
            )
            db.add(test_prof)
            db.commit()
            
            test_profile = ProviderProfile(
                id=uuid.uuid4(),
                user_id=test_id,
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
                bio="Certified multi-skill technician for testing. Switch categories in dashboard.",
                city="Hyderabad",
                address="Flat 101, Srinivasa Residency, Madhapur, Hyderabad",
                skills="Leak Repair, Switchboard installation, Smart Diagnostics",
                service_radius_km=15.0
            )
            db.add(test_profile)
            db.commit()
        print("Database already contains data. Skipping seeding.")
        return

    print("Generating comprehensive HomeSphere AI test dataset...")

    # Name generator components
    first_names = [
        "Amit", "Suresh", "Rajesh", "Vikas", "Pooja", "Baldev", "Neha", "Sunil", "Priya", "Rohan",
        "Rahul", "Deepak", "Vivek", "Sanjay", "Anil", "Manoj", "Arjun", "Vijay", "Alok", "Sandeep",
        "Kunal", "Neeraj", "Sachin", "Aditya", "Harsh", "Gaurav", "Ananya", "Aaradhya", "Sneha", "Ritu",
        "Divya", "Kavita", "Kiran", "Sunita", "Jyoti", "Anita", "Megha", "Shilpa", "Swati", "Preeti",
        "Payal", "Aarti", "Karan", "Ajay", "Vikram", "Abhishek", "Rajat", "Sumit", "Mayank", "Manish",
        "Pranav", "Ashish", "Nikhil", "Pankaj", "Tarun", "Varun", "Ravi", "Anoop", "Raman", "Devendra"
    ]
    last_names = [
        "Sharma", "Kumar", "Varma", "Singh", "Patel", "Gupta", "Yadav", "Das", "Mehta", "Joshi",
        "Sen", "Rao", "Reddy", "Mishra", "Nair", "Pillai", "Iyer", "Banerjee", "Chatterjee", "Mukherjee",
        "Trivedi", "Chaturvedi", "Shukla", "Pandey", "Pathak", "Choudhury", "Bose", "Dutta", "Roy", "Malhotra"
    ]
    
    cities = ["Hyderabad", "Mumbai", "Bengaluru", "Delhi NCR", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur"]
    states = ["Telangana", "Maharashtra", "Karnataka", "Delhi", "Maharashtra", "Tamil Nadu", "West Bengal", "Gujarat", "Rajasthan"]
    
    used_names = set()
    def get_unique_indian_name():
        for _ in range(1000):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            if name not in used_names:
                used_names.add(name)
                return name
        return "Rajesh Kumar"

    # 1. Seed Super Admin
    super_admin = User(
        id=uuid.uuid4(),
        email="9369022460sa@gmail.com",
        name="Super Admin",
        phone="+91 93690 22460",
        role="SUPER_ADMIN",
        status="ACTIVE",
        firebase_uid="super_admin_firebase_uid_101"
    )
    db.add(super_admin)

    # 2. Seed Default Test Professional
    test_prof_id = uuid.uuid4()
    test_prof = User(
        id=test_prof_id,
        email="xatyammishra07@gmail.com",
        name="Satyam Mishra",
        phone="+91 98765 43210",
        role="PROVIDER",
        status="APPROVED",
        firebase_uid="worker_satyam_firebase_uid_707"
    )
    db.add(test_prof)
    
    test_prof_profile = ProviderProfile(
        id=uuid.uuid4(),
        user_id=test_prof_id,
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
        bio="Certified multi-skill technician for testing. Switch categories in dashboard.",
        city="Hyderabad",
        address="Flat 101, Srinivasa Residency, Madhapur, Hyderabad",
        skills="Leak Repair, Switchboard installation, Smart Diagnostics",
        service_radius_km=15.0
    )
    db.add(test_prof_profile)

    # 3. Seed 30 Categories with 5 professionals each = 150 professionals
    categories = [
        "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "RO Repair", "Refrigerator Repair", 
        "Washing Machine Repair", "TV Repair", "Laptop Repair", "Mobile Repair", "CCTV Installation", 
        "Pest Control", "Deep Cleaning", "Sofa Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", 
        "Home Painting", "Interior Designer", "Appliance Installation", "Packers & Movers", "Home Tutor", 
        "Fitness Trainer", "Yoga Instructor", "Beautician", "Makeup Artist", "Pet Care", "Elder Care", 
        "Babysitter", "Driver on Demand"
    ]
    
    professionals = []
    professional_profiles = []
    
    for cat in categories:
        for idx in range(1, 6):
            p_id = uuid.uuid4()
            p_name = get_unique_indian_name()
            p_email = f"{cat.lower().replace(' ', '')}{idx}@homesphere.com"
            p_phone = f"+91 9{random.randint(100000000, 999999999)}"
            
            user_obj = User(
                id=p_id,
                email=p_email,
                name=p_name,
                phone=p_phone,
                role="PROVIDER",
                status="APPROVED",
                firebase_uid=f"provider_uid_{cat.lower().replace(' ', '')}_{idx}"
            )
            professionals.append(user_obj)
            
            city_idx = random.randint(0, len(cities)-1)
            prof_obj = ProviderProfile(
                id=uuid.uuid4(),
                user_id=p_id,
                category=cat,
                experience_yrs=random.randint(1, 20),
                rating=round(random.uniform(4.0, 5.0), 2),
                is_available=True,
                is_verified=True,
                hourly_rate=float(random.choice([150, 200, 250, 300, 350, 400, 450, 500, 600])),
                success_rate=round(random.uniform(90.0, 100.0), 1),
                response_rate=round(random.uniform(85.0, 100.0), 1),
                aadhaar_url="https://res.cloudinary.com/homesphere/image/upload/v1/dummy_aadhaar.jpg",
                selfie_url="https://res.cloudinary.com/homesphere/image/upload/v1/dummy_selfie.jpg",
                bio=f"Certified professional {cat} serving residential and commercial units.",
                city=cities[city_idx],
                address=f"Flat {random.randint(101, 808)}, Block {random.choice(['A','B','C'])}, Area Road, {cities[city_idx]}",
                skills=f"{cat} repair, Fault diagnostics, installation",
                service_radius_km=float(random.randint(10, 25))
            )
            professional_profiles.append(prof_obj)

    # Add a pending professional to show verification queue
    pending_id = uuid.uuid4()
    pending_user = User(
        id=pending_id,
        email="rahul.verma@example.com",
        name="Rahul Verma",
        phone="+91 98111 22233",
        role="PROVIDER",
        status="PENDING",
        firebase_uid="worker_pending_uid_999"
    )
    db.add(pending_user)
    
    pending_profile = ProviderProfile(
        id=uuid.uuid4(),
        user_id=pending_id,
        category="Electrician",
        experience_yrs=4,
        rating=5.0,
        is_available=False,
        is_verified=False,
        hourly_rate=300.0,
        aadhaar_url="https://res.cloudinary.com/homesphere/image/upload/v1/pending_aadhaar.pdf",
        selfie_url="https://res.cloudinary.com/homesphere/image/upload/v1/pending_selfie.jpg",
        bio="Domestic wiring specialist awaiting verification audit.",
        city="Hyderabad",
        address="Sector 4, Kondapur, Hyderabad"
    )
    db.add(pending_profile)

    # 4. Generate 100 customers
    customers = []
    for idx in range(1, 101):
        c_id = uuid.UUID("5300bfd4-1a2c-4977-9876-000000000001") if idx == 1 else uuid.uuid4()
        c_name = get_unique_indian_name()
        c_email = f"customer{idx}@gmail.com"
        c_phone = f"+91 8{random.randint(100000000, 999999999)}"
        city_idx = random.randint(0, len(cities)-1)
        
        user_obj = User(
            id=c_id,
            email=c_email,
            name=c_name,
            phone=c_phone,
            role="CUSTOMER",
            status="ACTIVE",
            firebase_uid=f"customer_uid_{idx}"
        )
        customers.append(user_obj)

    # Batch save users & profiles
    db.bulk_save_objects(professionals)
    db.bulk_save_objects(professional_profiles)
    db.bulk_save_objects(customers)
    db.commit()

    # Refresh local list
    all_pros = db.query(User).filter(User.role == "PROVIDER", User.status == "APPROVED").all()
    all_customers = db.query(User).filter(User.role == "CUSTOMER").all()
    
    # Map pros by category for quick lookup
    pros_by_category = {}
    for p in all_pros:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == p.id).first()
        if profile:
            if profile.category not in pros_by_category:
                pros_by_category[profile.category] = []
            pros_by_category[profile.category].append((p, profile))

    # 5. Generate Bookings, Payments, Reviews & Invoices
    print("Generating simulated historical transactions (2200 bookings)...")
    bookings_to_save = []
    reviews_to_save = []
    payments_to_save = []
    invoices_to_save = []
    wallet_tx_to_save = []
    
    # 2000 Completed bookings
    # 100 Active bookings
    # 50 Cancelled bookings
    # 50 Pending bookings
    
    status_distribution = (
        ["COMPLETED"] * 2000 + 
        ["IN_PROGRESS"] * 100 + 
        ["CANCELLED"] * 50 + 
        ["REQUESTED"] * 50
    )
    
    comments = [
        "Excellent service, resolved the issue quickly.",
        "Very professional technician. Polite and clean work.",
        "Fixed the problem properly. Recommended!",
        "Punctual and experienced. Fair pricing.",
        "Identified the fault in minutes. Good job.",
        "Decent rates, nice behavior, completed on time.",
        "Quality repair work. Will book again.",
        "Very fast turnaround. Saved me in an emergency.",
        "Work was satisfactory and cleanly executed.",
        "Great troubleshooting skills. Recommended."
    ]
    
    start_time = datetime.utcnow()
    
    for i, status in enumerate(status_distribution):
        b_id = uuid.uuid4()
        c_user = random.choice(all_customers)
        cat = random.choice(categories)
        
        # Pick matching professional
        pro_pool = pros_by_category.get(cat, [(test_prof, test_prof_profile)])
        pro_user, pro_profile = random.choice(pro_pool)
        
        # Schedule back in time
        days_offset = random.randint(1, 180)
        scheduled = start_time - timedelta(days=days_offset)
        
        labor = pro_profile.hourly_rate
        material = float(random.choice([0, 150, 250, 400, 600, 800]))
        total = labor + material
        
        pay_status = "PENDING"
        if status == "COMPLETED":
            pay_status = "PAID"
        elif status == "CANCELLED":
            pay_status = "FAILED"
            
        booking = Booking(
            id=b_id,
            customer_id=c_user.id,
            provider_id=pro_user.id,
            service_type=cat,
            description=f"Standard diagnostic check and emergency fixing for {cat}.",
            status=status,
            scheduled_time=scheduled,
            is_emergency=(random.random() < 0.25),
            labor_cost=labor,
            material_cost=material,
            total_cost=total,
            address=f"Flat {random.randint(101, 909)}, Area Road, {pro_profile.city}",
            payment_status=pay_status,
            latitude=17.4485,
            longitude=78.3741,
            created_at=scheduled - timedelta(hours=2)
        )
        bookings_to_save.append(booking)
        
        # Razorpay payments
        pay_record_status = "CREATED"
        if status == "COMPLETED":
            pay_record_status = "CAPTURED"
        elif status == "CANCELLED":
            pay_record_status = "FAILED"
            
        payment = PaymentRecord(
            id=uuid.uuid4(),
            user_id=c_user.id,
            booking_id=b_id,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
            razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}" if status == "COMPLETED" else None,
            amount=total,
            status=pay_record_status,
            signature="test_sig_" + uuid.uuid4().hex[:10] if status == "COMPLETED" else None,
            created_at=scheduled
        )
        payments_to_save.append(payment)
        
        # Completed extra records
        if status == "COMPLETED":
            # 1. Invoice with GST
            gst = round(total * 0.18, 2)
            invoice = Invoice(
                id=uuid.uuid4(),
                booking_id=b_id,
                gst_amount=gst,
                total_paid=total,
                pdf_url=f"http://localhost:8000/static/uploads/invoice_{b_id}.pdf",
                created_at=scheduled
            )
            invoices_to_save.append(invoice)
            
            # 2. Review
            review = Review(
                id=uuid.uuid4(),
                booking_id=b_id,
                customer_id=c_user.id,
                provider_id=pro_user.id,
                rating=random.choice([4, 5, 5, 5, 4, 3, 5]),
                comment=random.choice(comments),
                is_flagged=(random.random() < 0.02), # 2% spam flagged
                ai_sentiment=round(random.uniform(0.75, 1.0), 2),
                created_at=scheduled + timedelta(hours=3)
            )
            reviews_to_save.append(review)
            
            # 3. Wallet Transaction (Provider Credit)
            tx = WalletTransaction(
                id=uuid.uuid4(),
                user_id=pro_user.id,
                amount=total,
                type="CREDIT",
                reference=f"Job earnings: {b_id}",
                created_at=scheduled
            )
            wallet_tx_to_save.append(tx)

    # Save all booking artifacts in bulk
    db.bulk_save_objects(bookings_to_save)
    db.bulk_save_objects(payments_to_save)
    db.bulk_save_objects(invoices_to_save)
    db.bulk_save_objects(reviews_to_save)
    db.bulk_save_objects(wallet_tx_to_save)
    db.commit()

    print(f"Data seeding finished! Generated {len(bookings_to_save)} bookings, {len(reviews_to_save)} reviews, and {len(payments_to_save)} records.")
