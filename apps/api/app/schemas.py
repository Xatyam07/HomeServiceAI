from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List

# --- AUTH SCHEMAS ---
class UserVerifyToken(BaseModel):
    id_token: str
    role: Optional[str] = "CUSTOMER"

class UserCreate(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "CUSTOMER" # CUSTOMER, PROVIDER, ADMIN
    category: Optional[str] = None # For providers
    experience_yrs: Optional[int] = 0 # For providers
    hourly_rate: Optional[float] = 150.0
    skills: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    aadhaar_url: Optional[str] = None
    pan_url: Optional[str] = None
    selfie_url: Optional[str] = None
    certificate_url: Optional[str] = None

class ProviderProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    category: str
    experience_yrs: int
    rating: float
    is_available: bool
    is_verified: bool
    hourly_rate: float
    success_rate: float
    response_rate: float
    address: Optional[str] = None
    city: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    status: str
    firebase_uid: str
    profile_photo: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    profile: Optional[ProviderProfileResponse] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- BOOKING SCHEMAS ---
class BookingCreate(BaseModel):
    customerId: UUID
    providerId: Optional[UUID] = None
    serviceType: str
    description: str
    address: str
    isEmergency: bool = False
    laborCost: float = 0.0
    materialCost: float = 0.0
    totalCost: float = 0.0
    durationMin: int = 60
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class BookingResponse(BaseModel):
    id: UUID
    customer_id: UUID
    provider_id: Optional[UUID]
    service_type: str
    description: str
    status: str
    scheduled_time: datetime
    is_emergency: bool
    labor_cost: float
    material_cost: float
    total_cost: float
    address: str
    tech_latitude: Optional[float]
    tech_longitude: Optional[float]
    eta_minutes: Optional[int]
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: str
    techLat: Optional[float] = None
    techLng: Optional[float] = None
    etaMinutes: Optional[int] = None

# --- AI SERVICES SCHEMAS ---
class DiagnosisRequest(BaseModel):
    description: str

class DiagnosisResponse(BaseModel):
    issue_detected: str
    explanation: str
    recommended_service: str
    urgency: str
    estimated_complexity: str
    confidence: float

class CostEstimateRequest(BaseModel):
    service_type: str
    complexity: str
    city: str
    is_emergency: bool = False

class CostEstimateResponse(BaseModel):
    labor_cost_min: float
    labor_cost_max: float
    material_cost_min: float
    material_cost_max: float
    total_cost_min: float
    total_cost_max: float
    duration_minutes: int
    gst_percent: float = 18.0

class ProviderCandidate(BaseModel):
    id: str
    name: str
    experience_yrs: int
    rating: float
    hourly_rate: float
    distance_km: float
    response_rate: float
    success_rate: float

class MatchRequest(BaseModel):
    service_type: str
    latitude: float
    longitude: float
    candidates: List[ProviderCandidate]

class RankedProvider(BaseModel):
    id: str
    name: str
    distance_km: float
    rating: float
    hourly_rate: float
    match_score: float
    estimated_arrival_minutes: int

class ReviewAnalysisRequest(BaseModel):
    review_text: str
    rating: int

class ReviewAnalysisResponse(BaseModel):
    is_spam: bool
    is_flagged: bool
    reason: str
    sentiment_score: float
    detected_spam_patterns: List[str]
