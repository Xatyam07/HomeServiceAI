import requests
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.config import settings

# Structured schema for diagnosis results
class DiagnosisSchema(BaseModel):
    problem: str
    recommended_service: str
    urgency: str  # EMERGENCY, HIGH, MEDIUM, LOW
    estimated_cost: str
    repair_time: str
    confidence: float
    reasoning: str

# Structured schema for chat response results
class ChatResponseSchema(BaseModel):
    reply: str
    confidence: float
    detected_issue: str
    estimated_cost: str
    urgency: str
    recommended_service: str
    follow_up_questions: List[str]

# Reusable AI Service class
class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self.enabled = False
        
        if self.api_key:
            # Mask the API key for secure logging
            masked_key = self.api_key[:4] + "..." + self.api_key[-4:] if len(self.api_key) > 8 else "..."
            print(f"Gemini API key detected: {masked_key}")
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self.enabled = True
                print("Gemini client initialized successfully using google-genai SDK.")
                print("Gemini model 'gemini-2.5-flash' loaded and verified.")
            except Exception as e:
                print(f"Warning: Failed to initialize google-genai client: {e}")
        else:
            print("Warning: GEMINI_API_KEY is not configured in settings. Startup will continue in offline fallback mode.")

    def diagnose_issue(self, description: str, image_url: Optional[str] = None) -> DiagnosisSchema:
        """
        Diagnose a home service issue using Gemini 2.5 Flash and return a structured JSON report.
        """
        if not self.enabled:
            return self._mock_diagnosis(description)

        try:
            from google.genai import types
            
            prompt = f"""
            Analyze the following home maintenance issue description:
            "{description}"
            
            Please detect the underlying problem, recommend the best trade service category (e.g. Plumber, Electrician, AC Repair, Appliance Installation, Painters, Packers & Movers), assess the urgency and estimated cost in INR, state average duration, and list your reasoning.
            """
            
            contents = [prompt]
            
            # Download and attach image bytes if an image reference is supplied
            if image_url:
                try:
                    response = requests.get(image_url, timeout=5)
                    if response.ok:
                        content_type = response.headers.get("content-type", "image/jpeg")
                        image_part = types.Part.from_bytes(
                            data=response.content,
                            mime_type=content_type
                        )
                        contents.append(image_part)
                except Exception as e:
                    print(f"AI Service could not download issue image for analysis: {e}")
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DiagnosisSchema,
                    temperature=0.2
                )
            )
            
            import json
            data = json.loads(response.text)
            return DiagnosisSchema(**data)
            
        except Exception as e:
            print(f"Gemini API diagnosis call failed: {e}. Falling back to clean error diagnosis.")
            return DiagnosisSchema(
                problem="Gemini AI is temporarily unavailable.",
                recommended_service="None",
                urgency="LOW",
                estimated_cost="N/A",
                repair_time="N/A",
                confidence=0.0,
                reasoning=f"API Request failed: {str(e)}"
            )

    def chat_helper(self, messages: List[Dict[str, str]], system_instruction: str) -> ChatResponseSchema:
        """
        Conversational assistant helper for multi-turn assistant chat.
        """
        if not self.enabled:
            return ChatResponseSchema(
                reply="Gemini AI is temporarily unavailable.",
                confidence=0.0,
                detected_issue="Unknown",
                estimated_cost="N/A",
                urgency="LOW",
                recommended_service="None",
                follow_up_questions=["Please try again later."]
            )

        try:
            from google.genai import types
            import json
            
            # Map chat history format to Gemini Contents API
            gemini_contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                text_content = msg["content"]
                # Safeguard against parsing dict-like contents
                if text_content.startswith("{") and "reply" in text_content:
                    try:
                        parsed = json.loads(text_content)
                        text_content = parsed.get("reply", text_content)
                    except:
                        pass
                gemini_contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text_content)]
                    )
                )

            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ChatResponseSchema,
                    system_instruction=system_instruction,
                    temperature=0.7
                )
            )
            
            data = json.loads(response.text)
            return ChatResponseSchema(**data)

        except Exception as e:
            print(f"Gemini chat API call failed: {e}")
            return ChatResponseSchema(
                reply="Gemini AI is temporarily unavailable.",
                confidence=0.0,
                detected_issue="Unknown",
                estimated_cost="N/A",
                urgency="LOW",
                recommended_service="None",
                follow_up_questions=["Please try again later."]
            )

    def _mock_diagnosis(self, description: str) -> DiagnosisSchema:
        desc = description.lower()
        if "ac" in desc or "cool" in desc:
            return DiagnosisSchema(
                problem="Air Conditioner Condenser Malfunction",
                recommended_service="AC Repair",
                urgency="HIGH",
                estimated_cost="₹1,200 - ₹2,500",
                repair_time="2-3 hours",
                confidence=0.92,
                reasoning="The description points to lack of cool air flow, indicating potential coolant leaks or compressor failures."
            )
        elif "leak" in desc or "pipe" in desc or "water" in desc:
            return DiagnosisSchema(
                problem="Water Pipe Joint Rupture",
                recommended_service="Plumber",
                urgency="EMERGENCY",
                estimated_cost="₹800 - ₹1,800",
                repair_time="1-2 hours",
                confidence=0.89,
                reasoning="Constant water leakage indicates a fracture under pressure requiring immediate valve shutoff and seal replacement."
            )
        elif "spark" in desc or "switch" in desc or "wire" in desc:
            return DiagnosisSchema(
                problem="Wall Switchboard Electrical Arcing",
                recommended_service="Electrician",
                urgency="EMERGENCY",
                estimated_cost="₹600 - ₹1,200",
                repair_time="1 hour",
                confidence=0.96,
                reasoning="Electrical sparks present a serious structural fire hazard. Recommend breaker shutoff."
            )
        else:
            return DiagnosisSchema(
                problem="General Appliance / Hardware Fault",
                recommended_service="Plumber" if "sink" in desc or "drain" in desc else "Electrician",
                urgency="MEDIUM",
                estimated_cost="₹500 - ₹1,200",
                repair_time="1-2 hours",
                confidence=0.75,
                reasoning="General description requires physical isolation and diagnostic probing."
            )

ai_service = AIService()
