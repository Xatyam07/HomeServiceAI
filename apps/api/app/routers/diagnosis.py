from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.ai_service import ai_service, DiagnosisSchema

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
async def chat_interaction(payload: ChatRequest):
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
    return {
        "reply": ai_response.reply,
        "response": ai_response.reply,
        "confidence": ai_response.confidence,
        "detected_issue": ai_response.detected_issue,
        "estimated_cost": ai_response.estimated_cost,
        "urgency": ai_response.urgency,
        "recommended_service": ai_response.recommended_service,
        "follow_up_questions": ai_response.follow_up_questions
    }
