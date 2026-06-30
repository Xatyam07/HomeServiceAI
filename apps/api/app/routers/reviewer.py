from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()

class ReviewAnalysisRequest(BaseModel):
    review_text: str
    rating: int

class ReviewAnalysisResponse(BaseModel):
    is_spam: bool
    is_flagged: bool
    reason: str
    sentiment_score: float # -1.0 to 1.0
    detected_spam_patterns: list[str]

@router.post("/", response_model=ReviewAnalysisResponse)
def analyze_review(req: ReviewAnalysisRequest):
    text = req.review_text.lower()
    
    # Heuristics for spam detection
    patterns = []
    is_spam = False
    
    # 1. URL links or suspicious contact insertions
    if re.search(r"https?://|\.com|\.in|\.net|www\.|whatsapp|call \d{10}", text):
        patterns.append("URL or Contact Information Redirect")
        is_spam = True
        
    # 2. Copied/Repetitive keywords (artificial padding)
    words = text.split()
    if len(words) > 10:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.4:
            patterns.append("High Keyword Repetitiveness (Potential Bot)")
            is_spam = True

    # 3. Promo code spamming
    if re.search(r"promo|discount|use code|click here|earn money", text):
        patterns.append("Marketing/Promo Codes Insertion")
        is_spam = True

    # Sentiment analysis heuristics
    positive_words = ["good", "great", "excellent", "awesome", "perfect", "quick", "polite", "professional", "satisfied", "clean", "best"]
    negative_words = ["bad", "worst", "slow", "rude", "delayed", "expensive", "rip", "dirty", "unprofessional", "scam", "waste", "poor"]
    
    pos_count = sum(1 for w in positive_words if w in text)
    neg_count = sum(1 for w in negative_words if w in text)
    
    # Calculate score
    total = pos_count + neg_count
    if total == 0:
        # Base on rating if neutral text
        sentiment = (req.rating - 3) / 2.0
    else:
        sentiment = (pos_count - neg_count) / total
        
    # Flag review if rating is 5 but sentiment is extremely negative, or rating is 1 but sentiment is extremely positive
    is_flagged = is_spam
    reason = "Genuine customer review."
    if is_spam:
        reason = "Flagged as SPAM: " + ", ".join(patterns)
    elif req.rating == 5 and sentiment < -0.3:
        is_flagged = True
        reason = "Flagged: Rating mismatch (5-stars with negative content)."
    elif req.rating == 1 and sentiment > 0.4:
        is_flagged = True
        reason = "Flagged: Rating mismatch (1-star with positive content)."

    return ReviewAnalysisResponse(
        is_spam=is_spam,
        is_flagged=is_flagged,
        reason=reason,
        sentiment_score=round(sentiment, 2),
        detected_spam_patterns=patterns
    )
