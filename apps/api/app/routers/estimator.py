from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class EstimateRequest(BaseModel):
    service_type: str
    complexity: str # SIMPLE, MODERATE, COMPLEX
    city: str # Mumbai, Bangalore, Delhi, etc.
    is_emergency: bool = False

class CostEstimate(BaseModel):
    labor_cost_min: float
    labor_cost_max: float
    material_cost_min: float
    material_cost_max: float
    total_cost_min: float
    total_cost_max: float
    duration_minutes: int
    gst_percent: float = 18.0

@router.post("/", response_model=CostEstimate)
def estimate_cost(req: EstimateRequest):
    # Base Indian pricing logic in INR
    base_rates = {
        "Electrician": {"base": 200, "duration": 45},
        "Plumber": {"base": 250, "duration": 50},
        "AC Repair": {"base": 400, "duration": 90},
        "Painter": {"base": 500, "duration": 180},
        "Pest Control": {"base": 800, "duration": 120},
        "Deep Cleaning": {"base": 1200, "duration": 240}
    }

    service = req.service_type if req.service_type in base_rates else "Plumber"
    stats = base_rates[service]

    # Complexity scale multipliers
    mult = 1.0
    duration_mult = 1.0
    mat_cost_min = 0.0
    mat_cost_max = 0.0

    if req.complexity == "SIMPLE":
        mult = 0.8
        duration_mult = 0.8
        mat_cost_min = 50.0
        mat_cost_max = 150.0
    elif req.complexity == "MODERATE":
        mult = 1.2
        duration_mult = 1.3
        mat_cost_min = 200.0
        mat_cost_max = 600.0
    elif req.complexity == "COMPLEX":
        mult = 2.0
        duration_mult = 2.0
        mat_cost_min = 1000.0
        mat_cost_max = 3500.0

    # City multiplier (Metros have higher labor rates)
    city_mult = 1.0
    metro_cities = ["mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata"]
    if req.city.lower() in metro_cities:
        city_mult = 1.25

    # Emergency surcharge
    emergency_mult = 1.5 if req.is_emergency else 1.0

    # Labor calculations
    labor_min = stats["base"] * mult * city_mult * emergency_mult
    labor_max = labor_min * 1.3

    # Total sums
    total_min = labor_min + mat_cost_min
    total_max = labor_max + mat_cost_max
    duration = int(stats["duration"] * duration_mult)

    return CostEstimate(
        labor_cost_min=round(labor_min, 2),
        labor_cost_max=round(labor_max, 2),
        material_cost_min=round(mat_cost_min, 2),
        material_cost_max=round(mat_cost_max, 2),
        total_cost_min=round(total_min, 2),
        total_cost_max=round(total_max, 2),
        duration_minutes=duration
    )
