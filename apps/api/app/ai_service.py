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
    estimated_time: str
    urgency: str
    recommended_service: str
    follow_up_questions: List[str]
    maintenance_tips: List[str]
    repair_vs_replacement: str

# Reusable AI Service class
class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self.enabled = False
        
        if self.api_key:
            masked_key = self.api_key[:4] + "..." + self.api_key[-4:] if len(self.api_key) > 8 else "..."
            print(f"Gemini API key detected: {masked_key}")
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self.enabled = True
                print("Gemini client initialized successfully using google-genai SDK.")
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
            
            Please detect the underlying problem, recommend the best trade service category (e.g. Plumber, Electrician, AC Repair, Appliance Installation, Painters, Packers & Movers), assess the urgency (EMERGENCY, HIGH, MEDIUM, LOW) and estimated cost in INR, state average duration (repair_time), and list your reasoning.
            If the description is in a language other than English (e.g., Hindi, Hinglish, Tamil), output reasoning and problem details in that language.
            """
            
            contents = [prompt]
            
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
            print(f"Gemini API diagnosis call failed: {e}. Falling back to mock.")
            return self._mock_diagnosis(description)

    def chat_helper(self, messages: List[Dict[str, str]], system_instruction: str) -> ChatResponseSchema:
        """
        Conversational assistant helper for multi-turn assistant chat.
        """
        if not self.enabled:
            return self._mock_chat(messages)

        try:
            from google.genai import types
            import json
            
            # Map chat history format to Gemini Contents API
            gemini_contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                text_content = msg["content"]
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

            upgraded_instruction = system_instruction + """
            You must reply back in the user's input language. If they talk in Hindi or Hinglish, answer in Hindi or Hinglish.
            Return a JSON object conforming exactly to ChatResponseSchema:
            - reply: detailed explanation/diagnostic response.
            - confidence: float score between 0.0 and 1.0.
            - detected_issue: name of the suspected fault.
            - estimated_cost: cost range in INR (e.g. ₹500 - ₹1200).
            - estimated_time: time required (e.g. 1-2 hours).
            - urgency: EMERGENCY, HIGH, MEDIUM, or LOW.
            - recommended_service: one of the 50 service categories.
            - follow_up_questions: list of 2-3 helpful diagnostic questions.
            - maintenance_tips: list of 2-3 preventive maintenance tips.
            - repair_vs_replacement: recommendations on whether to repair or replace the unit.
            """

            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ChatResponseSchema,
                    system_instruction=upgraded_instruction,
                    temperature=0.7
                )
            )
            
            data = json.loads(response.text)
            return ChatResponseSchema(**data)

        except Exception as e:
            print(f"Gemini chat API call failed: {e}. Falling back to mock chat.")
            return self._mock_chat(messages)

    def _mock_diagnosis(self, description: str) -> DiagnosisSchema:
        desc = description.lower()
        if "ac" in desc or "cool" in desc:
            return DiagnosisSchema(
                problem="Air Conditioner Compressor Issue",
                recommended_service="AC Repair",
                urgency="HIGH",
                estimated_cost="₹1,500 - ₹3,500",
                repair_time="2-3 hours",
                confidence=0.95,
                reasoning="Warm airflow and metallic clicking suggests compressor start-capacitor wear or coolant leakage."
            )
        elif "leak" in desc or "pipe" in desc or "water" in desc:
            return DiagnosisSchema(
                problem="Water Pipe Joint Leakage",
                recommended_service="Plumber",
                urgency="EMERGENCY",
                estimated_cost="₹500 - ₹1,200",
                repair_time="1 hour",
                confidence=0.91,
                reasoning="Active dripping indicates seal decay or joint rupture requiring immediate copper pipe replacement."
            )
        elif "spark" in desc or "switch" in desc or "wire" in desc:
            return DiagnosisSchema(
                problem="Electrical Socket Arcing",
                recommended_service="Electrician",
                urgency="EMERGENCY",
                estimated_cost="₹400 - ₹800",
                repair_time="45 minutes",
                confidence=0.97,
                reasoning="Sparks and charring indicate loose wiring terminals. Breaker must be shut off immediately to prevent fire."
            )
        else:
            return DiagnosisSchema(
                problem="General Equipment Fault",
                recommended_service="Electrician",
                urgency="MEDIUM",
                estimated_cost="₹300 - ₹900",
                repair_time="1-2 hours",
                confidence=0.80,
                reasoning="General symptom requires visual isolation and circuit troubleshooting."
            )

    def _mock_chat(self, messages: List[Dict[str, str]]) -> ChatResponseSchema:
        last_msg = messages[-1]["content"].lower() if messages else ""
        
        reply = "I understand you are facing a home maintenance issue. Can you check if there is any leaking water, funny smell, or sparks? That will help me diagnose."
        detected = "Unknown Appliance Issue"
        cost = "₹500 - ₹1,500"
        duration = "1-2 hours"
        urgency = "MEDIUM"
        cat = "Electrician"
        tips = ["Keep the appliance unplugged when not in use.", "Avoid self-repairing complex electrical components."]
        rvs = "Repair is recommended as the issue appears minor. Replacement is only needed if the internal coils are burnt."
        follow_ups = ["Is the unit turning on at all?", "Are there any indicators flashing?"]
        
        if "ac" in last_msg or "cooling" in last_msg:
            reply = "आपका एसी ठंडा नहीं कर रहा है। यह कंडेनसर या गैस लीकेज की वजह से हो सकता है। कृपया जांचें कि क्या बाहरी यूनिट चल रही है।"
            detected = "AC Cooling Failure"
            cost = "₹1,200 - ₹2,500"
            duration = "2 hours"
            urgency = "HIGH"
            cat = "AC Repair"
            tips = ["Clean AC filters every 2 weeks.", "Ensure the outdoor unit has clear airflow."]
            rvs = "Repairing the condenser is 70% cheaper than buying a new AC. Recommend repair."
            follow_ups = ["एसी यूनिट चालू करने पर क्या कोई आवाज आ रही है?", "क्या रिमोट पर कोई एरर कोड दिखाई दे रहा है?"]
        elif "leak" in last_msg or "pipe" in last_msg or "water" in last_msg:
            reply = "नल या पाइप से पानी लीक होना पानी के प्रेशर को नुकसान पहुंचा सकता है। मुख्य वाल्व को बंद करें ताकि पानी की बचत हो सके।"
            detected = "Plumbing Leak"
            cost = "₹600 - ₹1,200"
            duration = "1 hour"
            urgency = "EMERGENCY"
            cat = "Plumber"
            tips = ["Replace tap washers annually to prevent drips.", "Use teflon tape on screw joints."]
            rvs = "A simple pipe replacement is standard. No need to replace the entire plumbing line."
            follow_ups = ["पानी कहाँ से लीक हो रहा है, जॉइंट से या पाइप के बीच से?", "क्या वाल्व बंद करने पर पानी रुक जाता है?"]
            
        return ChatResponseSchema(
            reply=reply,
            confidence=0.90,
            detected_issue=detected,
            estimated_cost=cost,
            estimated_time=duration,
            urgency=urgency,
            recommended_service=cat,
            follow_up_questions=follow_ups,
            maintenance_tips=tips,
            repair_vs_replacement=rvs
        )

ai_service = AIService()
