from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ProviderCandidate(BaseModel):
    id: str = ""
    name: str
    experience_yrs: int
    rating: float
    hourly_rate: float
    distance_km: float
    response_rate: float # 0 to 100
    success_rate: float # 0 to 100

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
    match_score: float # Percentage 0-100
    estimated_arrival_minutes: int

@router.post("/", response_model=List[RankedProvider])
def smart_matching(req: MatchRequest):
    ranked = []
    
    for c in req.candidates:
        # Scoring algorithm weighting:
        # Distance (30%): closer is better, penalty for > 15km
        # Rating (25%): 5-star is ideal
        # Experience (15%): capped at 15 years
        # Pricing (15%): lower is better
        # Success/Response Rate (15%): reliability

        dist_score = max(0, 100 - (c.distance_km * 7.5)) # 0 score at 13.3km
        rating_score = (c.rating / 5.0) * 100
        exp_score = min(100, (c.experience_yrs / 10.0) * 100)
        
        # Assume average rate of 400 INR. If hourly_rate is lower, score increases.
        price_score = max(0, 100 - (c.hourly_rate / 800.0) * 100)
        
        reliability_score = (c.response_rate * 0.4) + (c.success_rate * 0.6)

        # Weighted aggregate
        total_score = (
            (dist_score * 0.30) +
            (rating_score * 0.25) +
            (exp_score * 0.15) +
            (price_score * 0.15) +
            (reliability_score * 0.15)
        )

        # Estimated arrival time: ~3 mins per km + 5 mins prep
        arrival = int(c.distance_km * 2.8 + 6)

        ranked.append(RankedProvider(
            id=c.name.lower().replace(" ", "_"),
            name=c.name,
            distance_km=round(c.distance_km, 1),
            rating=c.rating,
            hourly_rate=c.hourly_rate,
            match_score=round(total_score, 1),
            estimated_arrival_minutes=max(4, arrival)
        ))

    # Sort by match score descending
    ranked.sort(key=lambda x: x.match_score, reverse=True)
    return ranked
