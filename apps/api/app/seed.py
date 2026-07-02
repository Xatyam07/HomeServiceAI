from sqlalchemy.orm import Session
from app.models import User, ProviderProfile, Booking, Review, WalletTransaction, PaymentRecord, Invoice
import uuid
import random
from datetime import datetime, timedelta

# 20 Indian Cities and their Center Coordinates (Lat, Lng)
CITIES_COORDINATES = {
    "Kanpur": (26.4499, 80.3319),
    "Lucknow": (26.8467, 80.9462),
    "Varanasi": (25.3176, 82.9739),
    "Prayagraj": (25.4358, 81.8463),
    "Delhi": (28.6139, 77.2090),
    "Noida": (28.5355, 77.3910),
    "Ghaziabad": (28.6692, 77.4538),
    "Gurugram": (28.4595, 77.0266),
    "Faridabad": (28.4089, 77.3178),
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Nagpur": (21.1458, 79.0882),
    "Nashik": (19.9975, 73.7898),
    "Ahmedabad": (23.0225, 72.5714),
    "Surat": (21.1702, 72.8311),
    "Vadodara": (22.3072, 73.1812),
    "Jaipur": (26.9124, 75.7873),
    "Jodhpur": (26.2389, 73.0243),
    "Udaipur": (24.5854, 73.7125),
    "Bhopal": (23.2599, 77.4126)
}

# 50+ Home Services Categories
CATEGORIES = [
    "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "AC Installation",
    "Refrigerator Repair", "Washing Machine Repair", "RO Repair", "Water Purifier Service",
    "Microwave Repair", "TV Repair", "Laptop Repair", "Computer Repair", "Mobile Repair",
    "CCTV Installation", "Door Lock Repair", "Furniture Assembly", "Deep Cleaning",
    "Bathroom Cleaning", "Kitchen Cleaning", "Home Cleaning", "Cook", "Chef", "Driver",
    "Maid", "Babysitter", "Gardener", "Pest Control", "Car Wash", "Laundry", "Tile Repair",
    "False Ceiling", "Interior Designer", "Architect", "Solar Installation", "Generator Repair",
    "Gas Pipeline Technician", "Welder", "Glass Repair", "Curtain Installation",
    "Electric Vehicle Charger Installation", "Water Tank Cleaning", "Sofa Cleaning",
    "Mattress Cleaning", "Window Cleaning", "Marble Polish", "Home Automation",
    "Smart Lock Installation", "Internet Technician", "Network Technician"
]

def seed_data(db: Session):
    print("Scaling HomeSphere AI to 1000+ Professionals & 50 Customers across 20 Indian Cities...")

    # Names definitions
    first_names_male = ["Amit", "Suresh", "Rajesh", "Vikas", "Sunil", "Rohan", "Rahul", "Deepak", "Vivek", "Sanjay", "Anil", "Manoj", "Arjun", "Vijay", "Alok", "Sandeep", "Kunal", "Neeraj", "Sachin", "Aditya", "Harsh", "Gaurav", "Karan", "Ajay", "Vikram", "Abhishek", "Rajat", "Sumit", "Mayank", "Manish", "Pranav", "Ashish", "Nikhil", "Pankaj", "Tarun", "Varun", "Ravi", "Anoop", "Raman", "Devendra", "Aarav", "Kabir", "Ishaan", "Rudra", "Reyansh", "Atharva", "Aaryan", "Dhruv", "Arnav", "Krishna"]
    first_names_female = ["Pooja", "Neha", "Priya", "Ananya", "Aaradhya", "Sneha", "Ritu", "Divya", "Kavita", "Kiran", "Sunita", "Jyoti", "Anita", "Megha", "Shilpa", "Swati", "Preeti", "Payal", "Aarti", "Diya", "Riya", "Ira", "Myra", "Saanvi", "Aanya", "Anika", "Prisha", "Aditi", "Tanvi", "Kriti", "Shruti", "Ishita", "Sanya", "Simran", "Nisha", "Rupali", "Shreya", "Kajal", "Ridhima"]
    last_names = ["Sharma", "Kumar", "Varma", "Singh", "Patel", "Gupta", "Yadav", "Das", "Mehta", "Joshi", "Sen", "Rao", "Reddy", "Mishra", "Nair", "Pillai", "Iyer", "Banerjee", "Chatterjee", "Mukherjee", "Trivedi", "Chaturvedi", "Shukla", "Pandey", "Pathak", "Choudhury", "Bose", "Dutta", "Roy", "Malhotra", "Kapoor", "Khanna", "Gill", "Mehra", "Bahl", "Suri", "Sood", "Kaur", "Saxena", "Sinha"]

    used_emails = set()
    used_phones = set()

    # 1. Super Admin configuration
    admin_email = "9369022460sa@gmail.com"
    super_admin = db.query(User).filter(User.email == admin_email).first()
    if not super_admin:
        super_admin = User(
            id=uuid.uuid4(),
            email=admin_email,
            name="Super Admin",
            phone="+91 93690 22460",
            role="SUPER_ADMIN",
            status="ACTIVE",
            firebase_uid="super_admin_firebase_uid_101"
        )
        db.add(super_admin)
        db.commit()
    else:
        super_admin.role = "SUPER_ADMIN"
        super_admin.status = "ACTIVE"
        db.commit()

    # 2. Test Professional configuration
    test_email = "xatyammishra07@gmail.com"
    test_user = db.query(User).filter(User.email == test_email).first()
    if not test_user:
        test_user_id = uuid.uuid4()
        test_user = User(
            id=test_user_id,
            email=test_email,
            name="Satyam Mishra",
            phone="+91 98765 43210",
            role="PROVIDER",
            status="APPROVED",
            firebase_uid="worker_satyam_firebase_uid_707"
        )
        db.add(test_user)
        db.commit()
    else:
        test_user.role = "PROVIDER"
        test_user.status = "APPROVED"
        db.commit()

    test_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == test_user.id).first()
    if not test_profile:
        test_profile = ProviderProfile(
            id=uuid.uuid4(),
            user_id=test_user.id,
            category="Plumber",
            experience_yrs=7,
            rating=4.95,
            is_available=True,
            is_verified=True,
            is_premium=True,
            hourly_rate=450.0,
            visit_charge=150.0,
            success_rate=98.0,
            response_rate=96.0,
            jobs_completed=142,
            upi_id="satyam@okaxis",
            gst="27SATYAM0071A1Z9",
            bank_name="HDFC Bank",
            bank_account="50100432840232",
            bank_ifsc="HDFC0000084",
            gender="Male",
            age=31,
            languages="English, Hindi, Telugu",
            city="Hyderabad",
            latitude=17.3850,
            longitude=78.4867,
            address="Flat 101, Srinivasa Residency, Madhapur, Hyderabad",
            skills="Leak Repair, Switchboard installation, Smart Diagnostics, Pipefitting",
            bio="Certified premium technician for testing. Switch categories or edit parameters in developer console.",
            service_radius_km=15.0
        )
        db.add(test_profile)
        db.commit()
    else:
        test_profile.is_verified = True
        test_profile.is_premium = True
        test_profile.category = "Plumber"
        test_profile.city = "Hyderabad"
        db.commit()

    # Mark emails as used
    used_emails.add(admin_email)
    used_emails.add(test_email)
    used_phones.add("+91 93690 22460")
    used_phones.add("+91 98765 43210")

    # 3. Create approximately 50 demo customer accounts
    customers = []
    print("Seeding 50 customer accounts...")
    for idx in range(1, 51):
        c_id = uuid.uuid4()
        
        # Name and Gender
        is_female = random.random() < 0.4
        c_gender = "Female" if is_female else "Male"
        first = random.choice(first_names_female) if is_female else random.choice(first_names_male)
        name = f"{first} {random.choice(last_names)}"
        
        email = f"customer{idx}@gmail.com"
        
        # Keep retrying until unique phone is generated
        phone = ""
        while True:
            phone = f"+91 8{random.randint(100000000, 999999999)}"
            if phone not in used_phones:
                used_phones.add(phone)
                break

        city = random.choice(list(CITIES_COORDINATES.keys()))
        lat, lng = CITIES_COORDINATES[city]
        
        # Saved addresses list serialized as JSON
        saved_addr = [
            {"label": "Home", "address": f"Flat {random.randint(101, 999)}, Heights Appts, Sector Road, {city}", "lat": lat + random.uniform(-0.02, 0.02), "lng": lng + random.uniform(-0.02, 0.02)},
            {"label": "Office", "address": f"Block B, Tech Park, Phase II, {city}", "lat": lat + random.uniform(-0.03, 0.03), "lng": lng + random.uniform(-0.03, 0.03)}
        ]
        
        import json
        cust = User(
            id=c_id,
            email=email,
            name=name,
            phone=phone,
            role="CUSTOMER",
            status="ACTIVE",
            firebase_uid=f"customer_uid_{idx}",
            profile_photo=f"https://randomuser.me/api/portraits/{'women' if is_female else 'men'}/{idx % 99}.jpg",
            saved_addresses=json.dumps(saved_addr),
            favourite_providers="[]",
            payment_methods=json.dumps(["UPI", "CARD", "WALLET"]),
            emergency_contacts=json.dumps([{"name": f"Spouse / Parent", "phone": f"+91 9{random.randint(100000000, 999999999)}"}])
        )
        customers.append(cust)

    db.bulk_save_objects(customers)
    db.commit()

    # Fetch newly created customers
    all_customers = db.query(User).filter(User.role == "CUSTOMER").all()

    # 4. Seeding 1000 professionals across 20 cities (50 professionals per city)
    print("Generating 1000 service professionals across 20 cities...")
    
    professionals_users = []
    professionals_profiles = []
    
    cities_list = list(CITIES_COORDINATES.keys())
    
    provider_idx = 1
    for city in cities_list:
        city_lat, city_lng = CITIES_COORDINATES[city]
        
        # We sample 50 distinct categories for each city
        city_categories = random.sample(CATEGORIES, 50)
        
        for cat in city_categories:
            p_id = uuid.uuid4()
            
            # Male / Female
            is_female = random.random() < 0.25 # 25% female professionals for babysitting, cleaning, tutors, etc.
            gender = "Female" if is_female else "Male"
            first = random.choice(first_names_female) if is_female else random.choice(first_names_male)
            name = f"{first} {random.choice(last_names)}"
            
            email = f"prof_{city.lower()}_{cat.lower().replace(' ', '')}_{provider_idx}@homesphere.com"
            while email in used_emails:
                email = f"prof_{city.lower()}_{cat.lower().replace(' ', '')}_{provider_idx}_{random.randint(1,99)}@homesphere.com"
            used_emails.add(email)

            phone = ""
            while True:
                phone = f"+91 9{random.randint(100000000, 999999999)}"
                if phone not in used_phones:
                    used_phones.add(phone)
                    break
            
            # Profile Photo (Dicebear Adventurer SVG Animated)
            clean_name = name.replace(" ", "")
            photo_url = f"https://api.dicebear.com/7.x/adventurer/svg?seed={clean_name}"

            user_obj = User(
                id=p_id,
                email=email,
                name=name,
                phone=phone,
                role="PROVIDER",
                status="APPROVED",
                firebase_uid=f"provider_uid_{provider_idx}",
                profile_photo=photo_url
            )
            professionals_users.append(user_obj)
            
            # Position coordinates slightly offset from city center
            lat = city_lat + random.uniform(-0.06, 0.06)
            lng = city_lng + random.uniform(-0.06, 0.06)
            
            hourly = float(random.choice([150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800]))
            visit = float(random.choice([99, 149, 199, 249, 299]))
            rating = round(random.uniform(4.2, 4.98), 2)
            jobs = random.randint(15, 420)
            exp = random.randint(1, 20)
            
            # Premium allocation (10% premium members)
            is_prem = random.random() < 0.10
            
            prof_obj = ProviderProfile(
                id=uuid.uuid4(),
                user_id=p_id,
                category=cat,
                experience_yrs=exp,
                rating=rating,
                is_available=True,
                is_verified=True,
                is_premium=is_prem,
                hourly_rate=hourly,
                visit_charge=visit,
                success_rate=round(random.uniform(92.0, 100.0), 1),
                response_rate=round(random.uniform(88.0, 100.0), 1),
                jobs_completed=jobs,
                aadhaar_url="https://res.cloudinary.com/homesphere/image/upload/v1/dummy_aadhaar.jpg",
                pan_url="https://res.cloudinary.com/homesphere/image/upload/v1/dummy_pan.jpg",
                selfie_url=photo_url,
                certificate_url="https://res.cloudinary.com/homesphere/image/upload/v1/dummy_cert.jpg",
                address=f"Flat {random.randint(101, 999)}, Block {random.choice(['A','B','C'])}, Area Road, {city}",
                city=city,
                latitude=lat,
                longitude=lng,
                bio=f"Certified expert in {cat} services with {exp} years of verified experience. Customer satisfaction guaranteed.",
                skills=f"{cat} service, troubleshooting, preventive maintenance",
                service_radius_km=float(random.randint(10, 30)),
                gender=gender,
                age=exp + random.randint(20, 25),
                languages="Hindi, English" if random.random() < 0.6 else "Hindi, English, Local Language",
                upi_id=f"{name.lower().replace(' ', '')}@okaxis",
                gst=f"27{uuid.uuid4().hex[:10].upper()}1Z5",
                bank_name=random.choice(["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"]),
                bank_account=f"91{random.randint(1000000000, 9999999999)}",
                bank_ifsc=f"{random.choice(['SBIN', 'HDFC', 'ICIC', 'UTIB'])}0000{random.randint(100, 999)}"
            )
            professionals_profiles.append(prof_obj)
            provider_idx += 1

    # Bulk insert professionals
    db.bulk_save_objects(professionals_users)
    db.bulk_save_objects(professionals_profiles)
    db.commit()
    print(f"Successfully seeded {len(professionals_users)} professional accounts.")

    # 5. Generate historical transactions: Bookings, Payments, Invoices, Reviews & Wallet Transactions
    print("Generating simulated historical bookings and transactions (1200 bookings)...")
    
    all_pros = db.query(User).filter(User.role == "PROVIDER", User.status == "APPROVED").all()
    
    # Map professionals by (city, category) for fast lookup during simulation
    pros_map = {}
    for p in all_pros:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == p.id).first()
        if profile:
            key = (profile.city, profile.category)
            if key not in pros_map:
                pros_map[key] = []
            pros_map[key].append((p, profile))

    bookings_to_save = []
    reviews_to_save = []
    payments_to_save = []
    invoices_to_save = []
    wallet_tx_to_save = []

    comments_pool = [
        "Excellent work! Very prompt and resolved the problem quickly.",
        "Super professional technician. Wore mask and kept everything clean.",
        "Fixed the leakage instantly. High quality work.",
        "Very courteous and experienced. Highly recommended!",
        "Diagnostics was spot on. Reasonable price.",
        "Decent rates, neat cleaning service.",
        "Excellent troubleshooting skills. Will call again.",
        "Quick service in an emergency. Highly grateful.",
        "Satisfactory work, clean finishing.",
        "Arrived on time and resolved everything efficiently."
    ]

    base_time = datetime.utcnow()
    
    # We will generate 1200 historical bookings
    for i in range(1200):
        c_user = random.choice(all_customers)
        # Parse customer city from saved addresses
        try:
            import json
            addresses = json.loads(c_user.saved_addresses)
            customer_city = addresses[0]["address"].split(", ")[-1]
        except:
            customer_city = "Kanpur"

        cat = random.choice(CATEGORIES)
        
        # Find matches in customer's city
        matches = pros_map.get((customer_city, cat), [])
        if not matches:
            # Fallback to any provider of this category
            flat_matches = [p for (key, p_list) in pros_map.items() if key[1] == cat for p in p_list]
            if flat_matches:
                pro_user, pro_profile = random.choice(flat_matches)
            else:
                pro_user, pro_profile = test_user, test_profile
        else:
            pro_user, pro_profile = random.choice(matches)

        days_ago = random.randint(1, 120)
        scheduled = base_time - timedelta(days=days_ago, hours=random.randint(1, 12))
        
        labor = pro_profile.hourly_rate * random.uniform(1, 3)
        material = float(random.choice([0, 100, 200, 450, 750]))
        discount = float(random.choice([0, 0, 0, 50, 100])) if labor > 300 else 0.0
        total = max(labor + material - discount, 50.0)
        
        # Distribution of statuses: 85% completed, 5% cancelled, 5% in progress, 5% requested
        status_rand = random.random()
        if status_rand < 0.85:
            status = "COMPLETED"
            pay_status = "PAID"
            pay_rec_status = "CAPTURED"
        elif status_rand < 0.90:
            status = "CANCELLED"
            pay_status = "FAILED"
            pay_rec_status = "FAILED"
        elif status_rand < 0.95:
            status = "IN_PROGRESS"
            pay_status = "PAID" if random.random() < 0.5 else "PENDING"
            pay_rec_status = "CAPTURED" if pay_status == "PAID" else "CREATED"
        else:
            status = "REQUESTED"
            pay_status = "PENDING"
            pay_rec_status = "CREATED"

        b_id = uuid.uuid4()
        booking = Booking(
            id=b_id,
            customer_id=c_user.id,
            provider_id=pro_user.id,
            service_type=cat,
            description=f"Standard checkup and repair service for {cat}.",
            status=status,
            scheduled_time=scheduled,
            is_emergency=(random.random() < 0.15),
            labor_cost=labor,
            material_cost=material,
            total_cost=total,
            address=f"Flat {random.randint(101, 808)}, Main Heights, {pro_profile.city}",
            latitude=pro_profile.latitude + random.uniform(-0.01, 0.01),
            longitude=pro_profile.longitude + random.uniform(-0.01, 0.01),
            payment_status=pay_status,
            otp=str(random.randint(1000, 9999)),
            otp_verified_at=scheduled + timedelta(minutes=15) if status in ["IN_PROGRESS", "COMPLETED"] else None,
            created_at=scheduled - timedelta(hours=3)
        )
        bookings_to_save.append(booking)
        
        # Payment details
        payment = PaymentRecord(
            id=uuid.uuid4(),
            user_id=c_user.id,
            booking_id=b_id,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
            razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}" if pay_status == "PAID" else None,
            amount=total,
            status=pay_rec_status,
            signature="sig_" + uuid.uuid4().hex[:10] if pay_status == "PAID" else None,
            payment_type=random.choice(["FULL_BEFORE", "FULL_AFTER", "PARTIAL", "WALLET"]),
            coupon_code="WELCOME50" if discount > 0 else None,
            discount_amount=discount,
            tip_amount=float(random.choice([0, 0, 20, 50, 100])) if status == "COMPLETED" else 0.0,
            created_at=scheduled
        )
        payments_to_save.append(payment)
        
        if status == "COMPLETED":
            # 1. Review
            rev = Review(
                id=uuid.uuid4(),
                booking_id=b_id,
                customer_id=c_user.id,
                provider_id=pro_user.id,
                rating=random.choice([4, 5, 5, 5, 4, 3, 5]),
                comment=random.choice(comments_pool),
                is_flagged=(random.random() < 0.01),
                ai_sentiment=round(random.uniform(0.70, 1.00), 2),
                created_at=scheduled + timedelta(hours=2)
            )
            reviews_to_save.append(rev)
            
            # 2. GST Invoice
            gst = round(total * 0.18, 2)
            invoice = Invoice(
                id=uuid.uuid4(),
                booking_id=b_id,
                gst_amount=gst,
                total_paid=total,
                pdf_url=f"/static/uploads/invoice_{b_id}.pdf",
                created_at=scheduled
            )
            invoices_to_save.append(invoice)
            
            # 3. Wallet transaction (credit provider earnings)
            tx = WalletTransaction(
                id=uuid.uuid4(),
                user_id=pro_user.id,
                amount=total,
                type="CREDIT",
                reference=f"Job complete: {b_id}",
                created_at=scheduled
            )
            wallet_tx_to_save.append(tx)

    # Save transactions in chunks to prevent SQLite memory issues
    chunk_size = 300
    for i in range(0, len(bookings_to_save), chunk_size):
        db.bulk_save_objects(bookings_to_save[i:i+chunk_size])
    for i in range(0, len(payments_to_save), chunk_size):
        db.bulk_save_objects(payments_to_save[i:i+chunk_size])
    for i in range(0, len(reviews_to_save), chunk_size):
        db.bulk_save_objects(reviews_to_save[i:i+chunk_size])
    for i in range(0, len(invoices_to_save), chunk_size):
        db.bulk_save_objects(invoices_to_save[i:i+chunk_size])
    for i in range(0, len(wallet_tx_to_save), chunk_size):
        db.bulk_save_objects(wallet_tx_to_save[i:i+chunk_size])
        
    db.commit()
    print(f"Data seeding completed successfully! Generated {len(bookings_to_save)} historical bookings, {len(payments_to_save)} payment records, and {len(reviews_to_save)} reviews.")

if __name__ == "__main__":
    from app.database import SessionLocal, engine
    from app.models import Base
    db = SessionLocal()
    try:
        print("Dropping existing tables for a clean 1052-user seed...")
        Base.metadata.drop_all(bind=engine)
        print("Recreating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Seeding database...")
        seed_data(db)
        print("Database seed completed successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
