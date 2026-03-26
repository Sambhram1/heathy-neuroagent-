from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"


class SleepQuality(str, Enum):
    poor = "poor"
    fair = "fair"
    good = "good"


class AlcoholUse(str, Enum):
    none = "none"
    occasional = "occasional"
    regular = "regular"


class UserProfile(BaseModel):
    age: int
    sex: str  # male/female/other
    height_cm: float
    weight_kg: float
    waist_cm: Optional[float] = None
    activity_level: ActivityLevel = ActivityLevel.sedentary
    diet_quality: int = Field(default=5, ge=1, le=10)
    sleep_hours: float = 7.0
    sleep_quality: SleepQuality = SleepQuality.fair
    stress_level: int = Field(default=5, ge=1, le=10)
    family_history: List[str] = []
    smoking: bool = False
    alcohol: AlcoholUse = AlcoholUse.none
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    fasting_glucose: Optional[float] = None

    @property
    def bmi(self) -> float:
        return self.weight_kg / ((self.height_cm / 100) ** 2)


class MentalHealthData(BaseModel):
    phq9_score: int = Field(default=0, ge=0, le=27)
    gad7_score: int = Field(default=0, ge=0, le=21)
    burnout_level: int = Field(default=5, ge=1, le=10)
    social_support: int = Field(default=5, ge=1, le=10)
    work_stress: int = Field(default=5, ge=1, le=10)


class RiskScores(BaseModel):
    diabetes_risk: float = 0.0
    hypertension_risk: float = 0.0
    cvd_risk: float = 0.0
    mental_health_index: float = 0.0
    overall_risk: float = 0.0


class ChatMessage(BaseModel):
    role: str  # user / assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    session_id: str


class ChatResponse(BaseModel):
    message: str
    risk_scores: Optional[RiskScores] = None
    plan_ready: bool = False
    amplifiers: Optional[List[str]] = None
    evidence: Optional[List[dict]] = None


class MentalChatMessage(BaseModel):
    role: str
    content: str


class MentalChatRequest(BaseModel):
    messages: List[MentalChatMessage]
    session_id: str


class MentalChatResponse(BaseModel):
    message: str
    crisis_detected: bool = False
