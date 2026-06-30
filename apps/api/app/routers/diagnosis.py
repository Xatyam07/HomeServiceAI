from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import random

router = APIRouter()

class DiagnosisResponse(BaseModel):
    issue_detected: str
    explanation: str
    recommended_service: str
    urgency: str # EMERGENCY, HIGH, MEDIUM, LOW
    estimated_complexity: str # COMPLEX, MODERATE, SIMPLE
    confidence: float

ISSUES_KNOWLEDGE = {
    "ac": {
        "issue_detected": "Air Conditioner Compressor Overheating / Coolant Leak",
        "explanation": "Your AC units are drawing power but failing to compress refrigerant. This is commonly caused by low coolant levels, blocked condenser coils, or a faulty compressor capacitor.",
        "recommended_service": "AC Repair",
        "urgency": "HIGH",
        "estimated_complexity": "MODERATE",
        "confidence": 0.94
    },
    "sink": {
        "issue_detected": "P-Trap Blockage and Corroded Seals",
        "explanation": "Water accumulation under the sink indicates that the rubber gasket sealing has worn thin, compounded by food/grease blockages inside the P-trap siphon.",
        "recommended_service": "Plumber",
        "urgency": "MEDIUM",
        "estimated_complexity": "SIMPLE",
        "confidence": 0.91
    },
    "leak": {
        "issue_detected": "Main Supply Pipe Hairline Fracture",
        "explanation": "Continuous water discharge under pressure indicates a localized fracture along the joint links. Shutting off the main valve is advised to prevent ceiling water damage.",
        "recommended_service": "Plumber",
        "urgency": "EMERGENCY",
        "estimated_complexity": "COMPLEX",
        "confidence": 0.88
    },
    "fan": {
        "issue_detected": "Ceiling Fan Ball Bearing Wear & Balance Imbalance",
        "explanation": "Grinding metallic sounds indicate that the central ball bearings have lost lubrication. Wobbling indicates a misaligned blade bracket.",
        "recommended_service": "Electrician",
        "urgency": "LOW",
        "estimated_complexity": "SIMPLE",
        "confidence": 0.95
    },
    "spark": {
        "issue_detected": "Short Circuit in Switchboard / Loose Terminal",
        "explanation": "Visible sparks or popping sounds point to active arcing behind the wall plate. This is a severe fire hazard. Please switch off the main circuit breaker immediately.",
        "recommended_service": "Electrician",
        "urgency": "EMERGENCY",
        "estimated_complexity": "MODERATE",
        "confidence": 0.97
    }
}

@router.post("/", response_model=DiagnosisResponse)
async def diagnose_home_issue(
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    if not description and not image:
        raise HTTPException(status_code=400, detail="Either description text or image must be provided.")
    
    text = (description or "").lower()
    
    # Simple semantic search match simulator
    match_key = None
    if "ac" in text or "cool" in text or "condenser" in text:
        match_key = "ac"
    elif "sink" in text or "drain" in text or "clog" in text:
        match_key = "sink"
    elif "leak" in text or "pipe" in text or "water burst" in text:
        match_key = "leak"
    elif "fan" in text or "noise" in text or "wobble" in text:
        match_key = "fan"
    elif "spark" in text or "switch" in text or "shock" in text or "wire" in text:
        match_key = "spark"

    # Default fallback
    if not match_key:
        if image:
            # Simulate image classifier detecting a plumbing issue
            match_key = random.choice(["sink", "leak"])
        else:
            # General fallback
            return DiagnosisResponse(
                issue_detected="Unspecified Appliance / Wiring Abnormality",
                explanation=f"Based on: '{description}', our model indicates a potential system fault. We recommend scheduling a physical inspection to isolate the cause.",
                recommended_service="Electrician" if "wire" in text or "power" in text else "Plumber",
                urgency="MEDIUM",
                estimated_complexity="MODERATE",
                confidence=0.75
            )
            
    res = ISSUES_KNOWLEDGE[match_key]
    return DiagnosisResponse(**res)
