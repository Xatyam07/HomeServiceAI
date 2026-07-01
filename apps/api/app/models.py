import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="CUSTOMER") # CUSTOMER, PROVIDER, ADMIN
    status = Column(String, default="ACTIVE")  # ACTIVE, PENDING, APPROVED, REJECTED, SUSPENDED
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    profile_photo = Column(String, nullable=True)
    last_login = Column(DateTime, default=datetime.utcnow, nullable=True)
    saved_addresses = Column(String, nullable=True)  # JSON-serialized list of addresses
    favourite_providers = Column(String, nullable=True)  # JSON-serialized list of UUIDs
    payment_methods = Column(String, nullable=True)  # JSON-serialized list of methods
    emergency_contacts = Column(String, nullable=True)  # JSON-serialized list of contacts
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("ProviderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_customer = relationship("Booking", foreign_keys="[Booking.customer_id]", back_populates="customer")
    bookings_as_provider = relationship("Booking", foreign_keys="[Booking.provider_id]", back_populates="provider")
    reviews_written = relationship("Review", foreign_keys="[Review.customer_id]", back_populates="customer")
    reviews_received = relationship("Review", foreign_keys="[Review.provider_id]", back_populates="provider")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")
    messages = relationship("Message", back_populates="sender")
    payment_records = relationship("PaymentRecord", back_populates="user")

class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    category = Column(String, nullable=False) # Electrician, Plumber, AC Repair, etc.
    experience_yrs = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    is_available = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    hourly_rate = Column(Float, default=150.0)
    success_rate = Column(Float, default=100.0)
    response_rate = Column(Float, default=100.0)
    
    # KYC & Profile Extensions
    aadhaar_url = Column(String, nullable=True)
    pan_url = Column(String, nullable=True)
    selfie_url = Column(String, nullable=True)
    certificate_url = Column(String, nullable=True)
    address = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    service_radius_km = Column(Float, default=15.0)
    
    # Marketplace Expansion Fields
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    languages = Column(String, nullable=True)
    visit_charge = Column(Float, default=0.0)
    jobs_completed = Column(Integer, default=0)
    upi_id = Column(String, nullable=True)
    gst = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_premium = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    service_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="REQUESTED") # REQUESTED, ASSIGNED, ACCEPTED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED, PAYMENT_SUCCESSFUL
    scheduled_time = Column(DateTime, default=datetime.utcnow)
    is_emergency = Column(Boolean, default=False)
    
    # Financial breakdown
    labor_cost = Column(Float, default=0.0)
    material_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    duration_min = Column(Integer, default=60)
    
    # Location coordinates
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    tech_latitude = Column(Float, nullable=True)
    tech_longitude = Column(Float, nullable=True)
    eta_minutes = Column(Integer, nullable=True)

    payment_status = Column(String, default="PENDING") # PENDING, PAID, REFUNDED, FAILED
    otp = Column(String, nullable=True)
    otp_verified_at = Column(DateTime, nullable=True)
    rejected_providers = Column(String, default="[]") # JSON list of provider IDs who rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def customer_name(self):
        return self.customer.name if self.customer else None

    @property
    def customer_email(self):
        return self.customer.email if self.customer else None

    @property
    def customer_name(self):
        return self.customer.name if self.customer else None

    @property
    def has_review(self):
        return self.review is not None

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="bookings_as_customer")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="bookings_as_provider")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="booking", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="booking", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, default=5)
    comment = Column(String, nullable=False)
    is_flagged = Column(Boolean, default=False)
    ai_sentiment = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="review")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="reviews_written")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="reviews_received")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="messages")
    sender = relationship("User", back_populates="messages")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    pdf_url = Column(String, nullable=True)
    gst_amount = Column(Float, default=0.0)
    total_paid = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="invoice")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # CREDIT, DEBIT
    reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wallet_transactions")

class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    razorpay_order_id = Column(String, nullable=False, index=True)
    razorpay_payment_id = Column(String, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default="CREATED") # CREATED, CAPTURED, REFUNDED, FAILED
    signature = Column(String, nullable=True)
    payment_type = Column(String, default="FULL_BEFORE") # FULL_BEFORE, FULL_AFTER, PARTIAL, WALLET, TIP
    coupon_code = Column(String, nullable=True)
    discount_amount = Column(Float, default=0.0)
    tip_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="payment_records")
    booking = relationship("Booking", back_populates="payments")
