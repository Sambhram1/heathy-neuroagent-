"""
DietEngine — Main IndianPlate AI orchestrator
Chains PlateProportioner → MealAssembler → annotates with metadata.
"""

from datetime import datetime, timezone

from indian_plate_ai.models.plate_proportioner import PlateProportioner
from indian_plate_ai.models.meal_assembler import MealAssembler
from indian_plate_ai.models.ml_recommender import MLFoodRecommender
from indian_plate_ai.data_prep import build_master_csv

MEDICAL_DISCLAIMER = (
    "This is a preventive wellness guide based on ICMR-NIN 2024 guidelines. "
    "Consult a registered dietitian for clinical dietary management. "
    "This does not substitute for personalised medical nutrition therapy."
)

ICMR_COMPLIANCE_NOTE = (
    "Plan follows ICMR-NIN Dietary Guidelines for Indians 2024: "
    "plate model with 50% vegetables & fruits, 25% whole grains/millets, "
    "25% pulses/protein, with preference for regional millets over refined cereals."
)


def _estimate_calories(user_profile: dict) -> int:
    """Harris-Benedict BMR × activity multiplier."""
    age    = user_profile.get("age", 35)
    sex    = user_profile.get("sex", "male").lower()
    weight = user_profile.get("weight_kg", 65)
    height = user_profile.get("height_cm", 165)
    activity = user_profile.get("activity_level", "sedentary")

    if sex in ("female", "f"):
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    else:
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)

    multipliers = {
        "sedentary": 1.2,
        "light":     1.375,
        "moderate":  1.55,
        "active":    1.725,
    }
    return round(bmr * multipliers.get(activity, 1.2))


class DietEngine:
    def __init__(self):
        # Build master CSV, then train/load ML models
        df = build_master_csv()
        self._proportioner = PlateProportioner()
        self._assembler = MealAssembler()

        # Train ML models (KNN + KMeans) and inject into the recommender
        ml = MLFoodRecommender()
        ml.load_or_train(df)
        self._assembler.recommender.ml_model = ml
        self.ml_model = ml   # exposed for explain endpoint

    def generate_plan(self, risk_scores: dict, user_profile: dict) -> dict:
        """
        Full pipeline: risk → portions → meal plan → metadata.

        Args:
            risk_scores: {diabetes, hypertension, cvd, mental} — 0 to 100
            user_profile: {age, sex, calorie_target (optional), is_vegetarian,
                           region, allergies, weight_kg, height_cm, activity_level}

        Returns:
            Complete diet plan dict.
        """
        age        = user_profile.get("age", 35)
        sex        = user_profile.get("sex", "male")
        is_veg     = user_profile.get("is_vegetarian", True)
        region     = user_profile.get("region", "north").lower()
        allergies  = user_profile.get("allergies", [])

        # Use provided calorie target or estimate from BMR
        calorie_target = user_profile.get("calorie_target")
        if not calorie_target or calorie_target <= 0:
            calorie_target = _estimate_calories(user_profile)

        # ── Layer 1: Portion targets ─────────────────────────────────────────
        portions = self._proportioner.calculate_portions(
            risk_scores=risk_scores,
            calorie_target=calorie_target,
            age=age,
            sex=sex,
        )

        # ── Layer 2+3: Assemble full day ─────────────────────────────────────
        plan = self._assembler.assemble_day(
            portions=portions,
            risk_scores=risk_scores,
            region=region,
            is_veg=is_veg,
        )

        # ── Annotate & wrap ──────────────────────────────────────────────────
        plan["plate_targets"] = portions
        plan["generated_at"] = datetime.now(timezone.utc).isoformat()
        plan["user_profile"] = {
            "age": age,
            "sex": sex,
            "calorie_target": calorie_target,
            "is_vegetarian": is_veg,
            "region": region,
            "allergies": allergies,
        }
        plan["risk_scores_used"] = risk_scores
        plan["icmr_compliance_note"] = ICMR_COMPLIANCE_NOTE
        plan["medical_disclaimer"] = MEDICAL_DISCLAIMER

        return plan
