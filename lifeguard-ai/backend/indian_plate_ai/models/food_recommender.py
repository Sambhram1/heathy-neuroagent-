"""
Layer 2 — FoodRecommender
Filters the master food database by constraints, scores each food via
a weighted composite of the 4 suitability scores, and returns the
top-k best-fit foods with explainability reasons.
"""

import pandas as pd
import numpy as np
from typing import List, Optional, TYPE_CHECKING

from indian_plate_ai.data_prep import get_master_df, build_master_csv

if TYPE_CHECKING:
    from indian_plate_ai.models.ml_recommender import MLFoodRecommender

# Blend weights: ML cosine score vs rule-based composite score
ML_WEIGHT   = 0.60
RULE_WEIGHT = 0.40


# ── Kitchen unit helpers ─────────────────────────────────────────────────────
def _to_kitchen_unit(grams: float, food_group: str, food_name: str) -> str:
    """Convert grams to approximate Indian kitchen units."""
    g = round(grams)
    name_lower = food_name.lower()

    if food_group == "fats":
        tsps = grams / 5
        return f"{g}g (~{tsps:.0f} tsp)"
    if food_group == "dairy":
        if "milk" in name_lower or "chaas" in name_lower or "buttermilk" in name_lower:
            glasses = grams / 200
            return f"{g}ml (~{glasses:.1f} glass)"
        katoris = grams / 150
        return f"{g}g (~{katoris:.1f} katori)"
    if food_group in ("cereals", "pulses"):
        if any(x in name_lower for x in ["roti", "dosa", "paratha", "idli", "uttapam"]):
            pieces = grams / 30
            return f"{g}g (~{pieces:.0f} piece{'s' if pieces != 1 else ''})"
        katoris = grams / 150
        return f"{g}g (~{katoris:.1f} katori)"
    if food_group == "nuts":
        if grams <= 20:
            return f"{g}g (1 small handful)"
        return f"{g}g (1 handful)"
    if food_group == "vegetables":
        katoris = grams / 100
        return f"{g}g (~{katoris:.0f} katori)"
    if food_group == "fruits":
        if grams >= 80:
            return f"{g}g (~1 medium piece)"
        return f"{g}g"
    if food_group == "protein":
        if "egg" in name_lower:
            eggs = max(1, round(grams / 55))
            return f"{g}g (~{eggs} egg{'s' if eggs > 1 else ''})"
        return f"{g}g"
    return f"{g}g"


# ── Reason generator ─────────────────────────────────────────────────────────
def _generate_reason(row: pd.Series, dominant: str) -> str:
    base_reasons = {
        "diabetes": "Low GI food that prevents blood sugar spikes",
        "hypertension": "Rich in potassium and magnesium, supports healthy blood pressure",
        "cvd": "High omega-3 and fiber, supports heart health",
        "mental": "Contains magnesium and tryptophan, supports mood regulation",
    }
    reason = base_reasons.get(dominant, "Nutritionally balanced ICMR-recommended choice")

    extras = []
    if row["is_millet"]:
        extras.append("ICMR-recommended millet")
    if row["is_probiotic"]:
        extras.append("probiotic for gut-brain axis")
    if row["omega3_g"] > 0.5:
        extras.append(f"omega-3 {row['omega3_g']:.1f}g/100g")
    if row["fiber_g"] > 5:
        extras.append(f"high fiber {row['fiber_g']:.1f}g")
    if row["potassium_mg"] > 300:
        extras.append(f"potassium {row['potassium_mg']:.0f}mg")
    if row["magnesium_mg"] > 40:
        extras.append(f"magnesium {row['magnesium_mg']:.0f}mg")
    if row["tryptophan_rich"]:
        extras.append("tryptophan-rich for serotonin synthesis")

    if extras:
        reason = reason.rstrip(".") + " — " + ", ".join(extras[:2]) + "."
    else:
        reason += "."
    return reason


class FoodRecommender:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self.ml_model: Optional["MLFoodRecommender"] = None  # injected by DietEngine

    @property
    def df(self) -> pd.DataFrame:
        if self._df is None:
            self._df = get_master_df()
        return self._df

    @property
    def total_foods(self) -> int:
        return len(self.df)

    def lookup(self, name: str) -> list:
        """Return nutritional info for foods matching a name query."""
        mask = self.df["food_name"].str.lower().str.contains(name.lower(), na=False)
        results = self.df[mask].to_dict(orient="records")
        return results

    def recommend_foods(
        self,
        food_group: str,
        portion_grams: float,
        risk_scores: dict,
        region: str,
        is_veg: bool,
        meal_type: str,
        already_used: List[str],
        top_k: int = 3,
    ) -> List[dict]:
        """
        Filter + score + return top_k foods for a given food_group and meal.

        Args:
            food_group: cereals | pulses | vegetables | dairy | nuts | fats | protein | fruits
            portion_grams: how many grams to serve
            risk_scores: {diabetes, hypertension, cvd, mental} 0-100
            region: north | south | east | west | pan-india
            is_veg: vegetarian filter
            meal_type: breakfast | lunch | snack | dinner
            already_used: list of food_ids already selected today
            top_k: number of results

        Returns:
            List of food dicts with grams, kcal, macros, and explanation.
        """
        df = self.df.copy()

        # ── 1. Hard filters ──────────────────────────────────────────────────
        df = df[df["food_group"] == food_group]

        if is_veg:
            df = df[df["is_vegetarian"] == True]

        # Region filter: accept food's region OR pan-india
        df = df[df["region"].isin([region, "pan-india"])]

        # Meal type filter: food's meal_type must contain requested meal
        # meal_type field is slash-separated e.g. "breakfast/lunch"
        def _meal_match(food_mt: str) -> bool:
            parts = [p.strip() for p in food_mt.split("/")]
            return meal_type in parts

        df = df[df["meal_type"].apply(_meal_match)]

        # Exclude already used foods
        df = df[~df["food_id"].isin(already_used)]

        if df.empty:
            # Fallback: relax meal filter
            df2 = self.df.copy()
            df2 = df2[df2["food_group"] == food_group]
            if is_veg:
                df2 = df2[df2["is_vegetarian"] == True]
            df2 = df2[df2["region"].isin([region, "pan-india"])]
            df2 = df2[~df2["food_id"].isin(already_used)]
            df = df2

        if df.empty:
            return []

        # ── 2. Rule-based composite score ────────────────────────────────────
        w_d = risk_scores.get("diabetes", 0) / 100
        w_h = risk_scores.get("hypertension", 0) / 100
        w_c = risk_scores.get("cvd", 0) / 100
        w_m = risk_scores.get("mental", 0) / 100
        total_w = w_d + w_h + w_c + w_m

        if total_w == 0:
            w_d = w_h = w_c = w_m = 0.25
            total_w = 1.0

        df = df.copy()
        df["rule_score"] = (
            w_d * df["diabetes_score"]
            + w_h * df["hypertension_score"]
            + w_c * df["cvd_score"]
            + w_m * df["mental_score"]
        ) / total_w

        # ── 3. ML cosine-similarity score (if model available) ───────────────
        if self.ml_model and self.ml_model.is_trained:
            candidate_ids = df["food_id"].tolist()
            ml_scores = self.ml_model.get_ml_scores(risk_scores, candidate_ids)
            df["ml_score"] = df["food_id"].map(ml_scores).fillna(0.5)
            # Hybrid: 60% ML + 40% rule
            df["composite_score"] = (
                ML_WEIGHT * df["ml_score"] + RULE_WEIGHT * df["rule_score"]
            )
            scoring_method = "hybrid (ML 60% + rule 40%)"
        else:
            df["ml_score"] = 0.5
            df["composite_score"] = df["rule_score"]
            scoring_method = "rule-based"

        df = df.sort_values("composite_score", ascending=False)
        top = df.head(top_k)

        # ── 4. Determine dominant condition for reason text ──────────────────
        weights = {"diabetes": w_d, "hypertension": w_h, "cvd": w_c, "mental": w_m}
        dominant = max(weights, key=weights.get)

        # ── 5. Build output records ──────────────────────────────────────────
        results = []
        for _, row in top.iterrows():
            serving_g = round(portion_grams, 1)
            kcal    = round(row["calories_per_100g"] * serving_g / 100, 1)
            protein = round(row["protein_g"]         * serving_g / 100, 1)
            fiber   = round(row["fiber_g"]           * serving_g / 100, 1)
            sodium  = round(row["sodium_mg"]         * serving_g / 100, 1)
            omega3  = round(row["omega3_g"]          * serving_g / 100, 2)

            results.append({
                "food_id":        row["food_id"],
                "food":           row["food_name"],
                "food_group":     row["food_group"],
                "region":         row["region"],
                "grams":          serving_g,
                "kitchen_unit":   _to_kitchen_unit(serving_g, row["food_group"], row["food_name"]),
                "kcal":           kcal,
                "protein_g":      protein,
                "fiber_g":        fiber,
                "sodium_mg":      sodium,
                "omega3_g":       omega3,
                "composite_score": round(float(row["composite_score"]), 3),
                "ml_score":       round(float(row["ml_score"]), 3),
                "rule_score":     round(float(row["rule_score"]), 3),
                "scoring_method": scoring_method,
                "reason":         _generate_reason(row, dominant),
            })

        return results
