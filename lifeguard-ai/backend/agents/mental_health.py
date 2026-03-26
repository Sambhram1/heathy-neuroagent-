from typing import List
from models.schemas import MentalHealthData

CRISIS_KEYWORDS = [
    "hopeless", "no point", "end it", "can't go on", "cant go on",
    "worthless", "hurt myself", "suicidal", "suicide", "kill myself",
    "don't want to live", "dont want to live", "life is not worth",
    "want to die", "give up on life",
]


def detect_crisis(message: str) -> bool:
    text = message.lower()
    return any(kw in text for kw in CRISIS_KEYWORDS)


def get_crisis_response() -> str:
    return (
        "I hear you, and I'm genuinely concerned about what you've shared. "
        "What you're feeling right now matters deeply. Please reach out for support — "
        "you don't have to go through this alone.\n\n"
        "**iCall (TISS):** 📞 9152987821 (Mon–Sat, 8am–10pm)\n"
        "**Vandrevala Foundation:** 📞 1860-2662-345 (24/7, free)\n"
        "**iCall WhatsApp:** wa.me/919152987821\n\n"
        "If you are in immediate danger, please call 112 (Emergency) or go to your nearest hospital. "
        "I'm here with you — would you like to talk about what's been happening?"
    )


def extract_mental_health_scores(conversation: List[dict]) -> MentalHealthData:
    phq9 = 0
    gad7 = 0
    burnout = 5
    social_support = 7
    work_stress = 5

    combined_text = " ".join(
        msg.get("content", "") for msg in conversation if msg.get("role") == "user"
    ).lower()

    # PHQ-9 heuristic estimation from conversation keywords
    if any(w in combined_text for w in ["hopeless", "no hope", "no future"]):
        phq9 += 6
    if any(w in combined_text for w in ["depressed", "very sad", "miserable", "terrible"]):
        phq9 += 5
    if any(w in combined_text for w in ["low mood", "down", "blue", "sad", "unhappy"]):
        phq9 += 3
    if any(w in combined_text for w in ["no energy", "exhausted", "tired all the time", "fatigue"]):
        phq9 += 3
    if any(w in combined_text for w in ["can't sleep", "insomnia", "wake up", "not sleeping well"]):
        phq9 += 2
    if any(w in combined_text for w in ["no interest", "nothing matters", "lost motivation"]):
        phq9 += 3
    if any(w in combined_text for w in ["worthless", "guilty", "failure", "useless"]):
        phq9 += 4

    # GAD-7 heuristic estimation
    if any(w in combined_text for w in ["anxious", "anxiety", "very anxious", "panic"]):
        gad7 += 5
    if any(w in combined_text for w in ["worried", "worry", "constant worry", "always worried"]):
        gad7 += 4
    if any(w in combined_text for w in ["on edge", "restless", "can't relax"]):
        gad7 += 3
    if any(w in combined_text for w in ["nervous", "tense", "stressed out"]):
        gad7 += 2
    if any(w in combined_text for w in ["irritable", "easily annoyed", "snapping"]):
        gad7 += 2

    # Burnout signals
    if any(w in combined_text for w in ["burnout", "burnt out", "burned out", "completely drained"]):
        burnout = 9
    elif any(w in combined_text for w in ["overworked", "no time", "work is killing"]):
        burnout = 7

    # Social support signals
    if any(w in combined_text for w in ["alone", "lonely", "no friends", "isolated", "no support"]):
        social_support = 2
    elif any(w in combined_text for w in ["supportive", "great friends", "family support"]):
        social_support = 8

    return MentalHealthData(
        phq9_score=min(phq9, 27),
        gad7_score=min(gad7, 21),
        burnout_level=min(burnout, 10),
        social_support=social_support,
        work_stress=work_stress,
    )


def get_mental_health_summary(data: MentalHealthData) -> str:
    # PHQ-9 severity
    if data.phq9_score <= 4:
        phq9_label = "Minimal depression"
    elif data.phq9_score <= 9:
        phq9_label = "Mild depression"
    elif data.phq9_score <= 14:
        phq9_label = "Moderate depression"
    elif data.phq9_score <= 19:
        phq9_label = "Moderately severe depression"
    else:
        phq9_label = "Severe depression"

    # GAD-7 severity
    if data.gad7_score <= 4:
        gad7_label = "Minimal anxiety"
    elif data.gad7_score <= 9:
        gad7_label = "Mild anxiety"
    elif data.gad7_score <= 14:
        gad7_label = "Moderate anxiety"
    else:
        gad7_label = "Severe anxiety"

    summary = (
        f"PHQ-9 Depression Screen: {data.phq9_score}/27 — {phq9_label}\n"
        f"GAD-7 Anxiety Screen: {data.gad7_score}/21 — {gad7_label}\n"
        f"Burnout Level: {data.burnout_level}/10\n"
        f"Social Support: {data.social_support}/10"
    )

    if data.phq9_score >= 10 or data.gad7_score >= 10:
        summary += (
            "\n\n⚠️ Your scores suggest you may benefit from speaking with a mental health professional. "
            "iCall: 9152987821 | Vandrevala: 1860-2662-345"
        )

    return summary
