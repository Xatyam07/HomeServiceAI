from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.ai_service import ai_service, DiagnosisSchema
from sqlalchemy.orm import Session
from app.database import get_db
import random

router = APIRouter()

class DiagnosisResponse(BaseModel):
    problem: str
    issue_detected: str  # mapped to problem for backward compatibility
    explanation: str  # mapped to reasoning for backward compatibility
    recommended_service: str
    urgency: str
    estimated_complexity: str  # MODERATE/COMPLEX/SIMPLE
    estimated_cost: str
    repair_time: str
    confidence: float
    reasoning: str

class ChatMessage(BaseModel):
    role: str  # user or model
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_instruction: Optional[str] = None

@router.post("/", response_model=DiagnosisResponse)
async def diagnose_home_issue(
    description: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None)
):
    if not description and not image_url:
        raise HTTPException(status_code=400, detail="Either description text or image url must be provided.")
    
    # Trigger Gemini structured AI diagnosis
    result: DiagnosisSchema = ai_service.diagnose_issue(description or "", image_url)
    
    # Map complexity based on urgency/time for client compatibility
    complexity_map = {
        "EMERGENCY": "COMPLEX",
        "HIGH": "COMPLEX",
        "MEDIUM": "MODERATE",
        "LOW": "SIMPLE"
    }
    complexity = complexity_map.get(result.urgency.upper(), "MODERATE")

    return DiagnosisResponse(
        problem=result.problem,
        issue_detected=result.problem,
        explanation=result.reasoning,
        recommended_service=result.recommended_service,
        urgency=result.urgency,
        estimated_complexity=complexity,
        estimated_cost=result.estimated_cost,
        repair_time=result.repair_time,
        confidence=result.confidence,
        reasoning=result.reasoning
    )

@router.post("/chat")
async def chat_interaction(payload: ChatRequest, db: Session = Depends(get_db)):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="Messages history must be supplied.")
    
    # Default prompt directives for helper
    system_prompt = payload.system_instruction or """
    You are the HomeSphere AI Assistant. You help customers diagnose home issues, estimate repair costs in INR, recommend trade services, and assist with booking.
    Be polite, concise, and structure your responses using clean markdown formatting. 
    If you identify an issue (e.g. leaking sink), mention the corresponding category: Electrician, Plumber, AC Repair, Packers & Movers, Painters, or Pest Control, so the customer knows which service to select.
    """
    
    # Convert payload to dictionary mapping
    msgs_dict = [{"role": m.role, "content": m.content} for m in payload.messages]
    
    ai_response = ai_service.chat_helper(msgs_dict, system_prompt)
    
    matched_professionals = []
    rec_service = ai_response.recommended_service or ""
    
    if not rec_service:
        # Fallback keyword matching
        lower_reply = ai_response.reply.lower()
        if "ac repair" in lower_reply or "ac is not cooling" in lower_reply:
            rec_service = "AC Repair"
        elif "plumber" in lower_reply or "leak" in lower_reply or "plumbing" in lower_reply:
            rec_service = "Plumber"
        elif "electrician" in lower_reply or "spark" in lower_reply or "electrical" in lower_reply:
            rec_service = "Electrician"
        elif "pest control" in lower_reply:
            rec_service = "Pest Control"
        elif "painter" in lower_reply or "painting" in lower_reply:
            rec_service = "Painter"

    if rec_service:
        from app.models import User, ProviderProfile
        # Match from DB
        providers = db.query(User, ProviderProfile).join(
            ProviderProfile, User.id == ProviderProfile.user_id
        ).filter(
            User.role == "PROVIDER",
            User.status == "APPROVED",
            ProviderProfile.category.ilike(f"%{rec_service}%")
        ).order_by(
            ProviderProfile.rating.desc(),
            ProviderProfile.experience_yrs.desc()
        ).limit(5).all()

        for u, p in providers:
            matched_professionals.append({
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "profile_photo": u.profile_photo or f"https://api.dicebear.com/7.x/adventurer/svg?seed={u.name.replace(' ', '')}",
                "rating": p.rating,
                "experience": p.experience_yrs,
                "price": p.hourly_rate,
                "city": p.city,
                "availability": "Available" if p.is_available else "Busy",
                "distance": round(random.uniform(0.5, 4.5), 1),
                "eta": random.randint(8, 25)
            })

    return {
        "reply": ai_response.reply,
        "response": ai_response.reply,
        "confidence": ai_response.confidence,
        "detected_issue": ai_response.detected_issue or rec_service,
        "estimated_cost": ai_response.estimated_cost,
        "estimated_time": ai_response.estimated_time,
        "urgency": ai_response.urgency,
        "recommended_service": rec_service,
        "follow_up_questions": ai_response.follow_up_questions,
        "maintenance_tips": ai_response.maintenance_tips,
        "repair_vs_replacement": ai_response.repair_vs_replacement,
        "matched_professionals": matched_professionals
    }
