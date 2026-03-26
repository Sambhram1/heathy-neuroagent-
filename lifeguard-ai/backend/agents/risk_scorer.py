from typing import Optional, List
from models.schemas import RiskScores


def calculate_risk_scores(
    age: int,
    sex: str,
    bmi: float,
    waist_cm: Optional[float] = None,
    activity_level: str = "sedentary",
    diet_quality: int = 5,
    sleep_hours: float = 7.0,
    sleep_quality: str = "fair",
    stress_level: int = 5,
    family_history: Optional[List[str]] = None,
    smoking: bool = False,
    phq9_estimate: int = 0,
    gad7_estimate: int = 0,
    systolic_bp: Optional[float] = None,
    fasting_glucose: Optional[float] = None,
) -> RiskScores:
    family_history = family_history or []

    # ── DIABETES RISK ────────────────────────────────────────────────────────────
    diabetes = 10.0

    if 23 <= bmi < 25:
        diabetes += 10
    elif 25 <= bmi < 30:
        diabetes += 20
    elif bmi >= 30:
        diabetes += 30

    if 35 <= age < 45:
        diabetes += 10
    elif 45 <= age < 55:
        diabetes += 15
    elif age >= 55:
        diabetes += 20

    if any(h.lower() in ("diabetes", "type 2 diabetes", "t2d") for h in family_history):
        diabetes += 20

    if activity_level == "sedentary":
        diabetes += 15
    elif activity_level == "light":
        diabetes += 5

    if sleep_hours < 6:
        diabetes += 10

    if stress_level > 7:
        diabetes += 10

    if fasting_glucose is not None:
        if 100 <= fasting_glucose < 126:
            diabetes += 25
        elif fasting_glucose >= 126:
            diabetes += 50

    diabetes = min(diabetes, 95)

    # ── HYPERTENSION RISK ────────────────────────────────────────────────────────
    hypertension = 10.0

    if 25 <= bmi < 30:
        hypertension += 15
    elif bmi >= 30:
        hypertension += 25

    if 40 <= age < 55:
        hypertension += 10
    elif age >= 55:
        hypertension += 20

    if diet_quality < 4:
        hypertension += 15

    if 6 <= stress_level <= 8:
        hypertension += 10
    elif stress_level > 8:
        hypertension += 20

    if sleep_quality == "poor":
        hypertension += 15

    if activity_level == "sedentary":
        hypertension += 10

    if systolic_bp is not None:
        if 130 <= systolic_bp < 140:
            hypertension += 20
        elif systolic_bp >= 140:
            hypertension += 40

    if any(h.lower() in ("hypertension", "high blood pressure", "hbp") for h in family_history):
        hypertension += 15

    hypertension = min(hypertension, 95)

    # ── CVD RISK (Framingham-adapted) ────────────────────────────────────────────
    cvd = 5.0

    if (sex == "male" and age > 45) or (sex == "female" and age > 55):
        cvd += 15

    if smoking:
        cvd += 25

    if 27 <= bmi < 30:
        cvd += 10
    elif bmi >= 30:
        cvd += 20

    if diabetes > 50:
        cvd += 10

    if hypertension > 50:
        cvd += 10

    if stress_level > 7:
        cvd += 8

    if phq9_estimate > 10 or gad7_estimate > 10:
        cvd += 12

    cvd = cvd * 1.3  # South Asian ethnicity multiplier
    cvd = min(cvd, 95)

    # ── MENTAL HEALTH INDEX ──────────────────────────────────────────────────────
    phq9_component = (phq9_estimate / 27) * 40
    gad7_component = (gad7_estimate / 21) * 30
    stress_component = (stress_level / 10) * 20
    sleep_component = 10 if sleep_quality == "poor" else (5 if sleep_quality == "fair" else 0)

    mental = phq9_component + gad7_component + stress_component + sleep_component
    mental = min(mental, 95)

    # ── OVERALL RISK ─────────────────────────────────────────────────────────────
    overall = (
        diabetes * 0.25
        + hypertension * 0.25
        + cvd * 0.30
        + mental * 0.20
    )
    overall = min(overall, 95)

    return RiskScores(
        diabetes_risk=round(diabetes, 1),
        hypertension_risk=round(hypertension, 1),
        cvd_risk=round(cvd, 1),
        mental_health_index=round(mental, 1),
        overall_risk=round(overall, 1),
    )
