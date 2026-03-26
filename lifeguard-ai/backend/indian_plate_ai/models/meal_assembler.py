"""
Layer 3 — MealAssembler
Splits daily portion targets across 4 meals, calls FoodRecommender
for each food group per meal, and assembles a full-day plan.
"""

from datetime import datetime
from typing import List

from indian_plate_ai.models.food_recommender import FoodRecommender


# ── Meal calorie split (must sum to 1.0) ─────────────────────────────────────
MEAL_CALORIE_SPLIT = {
    "breakfast": 0.25,
    "lunch": 0.35,
    "snack": 0.15,
    "dinner": 0.25,
}

# ── Per-meal food group distribution (fraction of daily group portion) ────────
# Each value = what fraction of the daily food group goes to that meal
MEAL_GROUP_DISTRIBUTION = {
    "breakfast": {
        "cereals":       0.28,
        "pulses":        0.18,
        "vegetables":    0.12,
        "dairy":         0.30,
        "fruits":        0.50,
        "nuts":          0.25,
        "fats":          0.25,
        "protein":       0.25,
    },
    "lunch": {
        "cereals":       0.37,
        "pulses":        0.40,
        "vegetables":    0.40,
        "dairy":         0.20,
        "fruits":        0.0,
        "nuts":          0.0,
        "fats":          0.35,
        "protein":       0.50,
    },
    "snack": {
        "cereals":       0.05,
        "pulses":        0.10,
        "vegetables":    0.08,
        "dairy":         0.15,
        "fruits":        0.50,
        "nuts":          0.60,
        "fats":          0.0,
        "protein":       0.0,
    },
    "dinner": {
        "cereals":       0.30,
        "pulses":        0.32,
        "vegetables":    0.40,
        "dairy":         0.35,
        "fruits":        0.0,
        "nuts":          0.15,
        "fats":          0.40,
        "protein":       0.25,
    },
}

# ── Groups to include per meal (skip zero-fraction groups) ───────────────────
MEAL_GROUPS = {
    "breakfast": ["cereals", "pulses", "vegetables", "dairy", "fruits", "nuts"],
    "lunch":     ["cereals", "pulses", "vegetables", "dairy", "protein", "fats"],
    "snack":     ["fruits", "nuts", "dairy"],
    "dinner":    ["cereals", "pulses", "vegetables", "dairy"],
}

# ── Foods to avoid by condition ──────────────────────────────────────────────
CONDITION_AVOIDS = {
    "diabetes": [
        "White rice — replace with ragi mudde or brown rice",
        "Sugary chai — switch to green tea or black coffee (no sugar)",
        "Maida (refined flour) items — choose whole wheat",
        "Potato fry — have boiled potato sparingly",
        "Fruit juices — eat whole fruit instead",
        "Packaged breakfast cereals — high sugar, high GI",
    ],
    "hypertension": [
        "Papad and pickles (achaar) — very high sodium",
        "Packaged namkeen and chips",
        "Extra table salt — use herbs/lemon instead",
        "Canned/processed foods",
        "Baking soda (sodium bicarbonate) in cooking",
    ],
    "cvd": [
        "Ghee in large amounts — limit to 1 tsp/day",
        "Vanaspati/Dalda (trans fat) — ban completely",
        "Fried snacks (samosa, puri, bhatura)",
        "Organ meats (brain, liver)",
        "Full-fat dairy in excess",
    ],
    "mental": [
        "Ultra-processed packaged foods",
        "Excessive caffeine (>2 cups/day)",
        "Alcohol",
        "Energy drinks (high sugar + caffeine)",
        "Skipping meals (causes cortisol spikes)",
    ],
}


def _get_avoids(risk_scores: dict) -> List[str]:
    avoids = []
    if risk_scores.get("diabetes", 0) >= 30:
        avoids.extend(CONDITION_AVOIDS["diabetes"])
    if risk_scores.get("hypertension", 0) >= 30:
        avoids.extend(CONDITION_AVOIDS["hypertension"])
    if risk_scores.get("cvd", 0) >= 30:
        avoids.extend(CONDITION_AVOIDS["cvd"])
    if risk_scores.get("mental", 0) >= 30:
        avoids.extend(CONDITION_AVOIDS["mental"])
    # deduplicate while preserving order
    seen = set()
    unique = []
    for item in avoids:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


def _get_add_more(risk_scores: dict, is_veg: bool) -> List[str]:
    recs = []
    if risk_scores.get("diabetes", 0) >= 30:
        recs += [
            "Ragi mudde / jowar roti instead of white rice",
            "Methi seeds (soaked overnight) — 2 tsp before meals",
            "More fibrous vegetables (karela, bhindi, lauki)",
        ]
    if risk_scores.get("hypertension", 0) >= 30:
        recs += [
            "Banana, guava, sweet potato for potassium",
            "Spinach and methi — high magnesium",
            "Chaas (unsalted buttermilk) daily",
        ]
    if risk_scores.get("cvd", 0) >= 30:
        add = ["Akhrot (walnuts) — 5-6 daily for omega-3",
               "Flaxseed (1 tbsp) in roti dough or sprinkled",
               "Sardines / rohu fish 2-3x per week" if not is_veg else "Chia seeds for plant omega-3"]
        recs += add
    if risk_scores.get("mental", 0) >= 30:
        recs += [
            "Dahi / chaas daily — probiotic for gut-brain axis",
            "Banana + pumpkin seeds for tryptophan + magnesium",
            "Turmeric milk at bedtime — anti-inflammatory",
        ]
    seen = set()
    unique = []
    for r in recs:
        if r not in seen:
            seen.add(r)
            unique.append(r)
    return unique[:8]


def _get_nutrient_gaps(daily_summary: dict, portions: dict) -> List[str]:
    gaps = []
    target_fiber = 30  # ICMR 2024 adult target
    target_protein = portions.get("pulses_protein_g", 85) * 0.25  # rough protein target
    target_potassium = portions.get("potassium_target_mg", 2000)
    target_sodium_limit = portions.get("sodium_limit_mg", 2000)

    if daily_summary.get("fiber_g", 0) < target_fiber * 0.7:
        gaps.append(f"Fiber below target ({daily_summary.get('fiber_g',0):.1f}g vs 30g goal) — add more vegetables and millets")
    if daily_summary.get("potassium_mg", 0) < target_potassium * 0.8:
        gaps.append(f"Potassium low ({daily_summary.get('potassium_mg',0):.0f}mg) — include banana, palak, sweet potato")
    if daily_summary.get("sodium_mg", 0) > target_sodium_limit:
        gaps.append(f"Sodium above limit ({daily_summary.get('sodium_mg',0):.0f}mg > {target_sodium_limit}mg) — reduce salt and pickles")
    if daily_summary.get("omega3_g", 0) < portions.get("omega3_target_g", 1.0):
        gaps.append(f"Omega-3 low ({daily_summary.get('omega3_g',0):.2f}g) — add akhrot, flaxseed, or fish")
    return gaps


def _meal_summary(meal: str, items: list, risk_scores: dict) -> str:
    top_risk = max(risk_scores, key=risk_scores.get) if risk_scores else None
    templates = {
        "breakfast": {
            "diabetes": "High-fiber millet breakfast to blunt morning glucose spikes",
            "hypertension": "Low-sodium, potassium-rich morning meal for blood pressure control",
            "cvd": "Heart-healthy breakfast rich in omega-3 and whole grains",
            "mental": "Probiotic and magnesium-rich morning meal to stabilise mood",
            None: "Balanced ICMR-plate breakfast with whole grains and protein",
        },
        "lunch": {
            "diabetes": "Low-GI balanced thali with high-fiber pulses and millets",
            "hypertension": "DASH-aligned Indian thali — potassium-rich vegetables and pulses",
            "cvd": "Heart-protective lunch — omega-3 fats, legumes, and greens",
            "mental": "Nutrient-dense midday meal with probiotic curd and tryptophan sources",
            None: "Complete Indian thali meeting ICMR macro and micro targets",
        },
        "snack": {
            "diabetes": "Low-GI snack to prevent afternoon glucose crash",
            "hypertension": "Light, potassium-rich snack for sustained energy",
            "cvd": "Nut-based snack delivering plant omega-3 and healthy fats",
            "mental": "Mood-supporting probiotic or magnesium-rich afternoon snack",
            None: "Light, nutrient-dense afternoon snack",
        },
        "dinner": {
            "diabetes": "Light low-GI dinner — easy to digest, prevents nocturnal glucose rise",
            "hypertension": "Low-sodium evening meal with magnesium-rich greens",
            "cvd": "Light, heart-friendly dinner — minimal saturated fat",
            "mental": "Calming dinner with tryptophan-rich foods and turmeric milk",
            None: "Light balanced dinner aligned with ICMR evening guidelines",
        },
    }
    condition = top_risk if (risk_scores.get(top_risk, 0) if top_risk else 0) >= 30 else None
    return templates.get(meal, {}).get(condition, templates.get(meal, {}).get(None, "Balanced meal"))


class MealAssembler:
    def __init__(self):
        self.recommender = FoodRecommender()

    def assemble_day(
        self,
        portions: dict,
        risk_scores: dict,
        region: str,
        is_veg: bool,
    ) -> dict:
        """
        Build a full-day meal plan from portions and risk scores.

        Returns a structured plan dict with meals, summaries, avoids, etc.
        """
        daily_groups = {
            "cereals":       portions.get("cereals_g", 250),
            "pulses":        portions.get("pulses_protein_g", 85),
            "vegetables":    portions.get("vegetables_g", 400),
            "dairy":         portions.get("dairy_ml", 300),
            "fruits":        portions.get("fruits_g", 100),
            "nuts":          portions.get("nuts_seeds_g", 35),
            "fats":          portions.get("fats_g", 27),
            "protein":       portions.get("pulses_protein_g", 85) * 0.8 if not is_veg else 0,
        }

        used_food_ids: List[str] = []
        meals_out = {}
        total_kcal = 0
        total_protein = 0
        total_fiber = 0
        total_sodium = 0
        total_potassium = 0
        total_omega3 = 0

        for meal_name in ["breakfast", "lunch", "snack", "dinner"]:
            meal_groups = MEAL_GROUPS[meal_name]
            distribution = MEAL_GROUP_DISTRIBUTION[meal_name]
            meal_items = []
            meal_kcal = 0

            for group in meal_groups:
                if group == "protein" and is_veg:
                    continue
                daily_amount = daily_groups.get(group, 0)
                if daily_amount <= 0:
                    continue
                frac = distribution.get(group, 0)
                if frac <= 0:
                    continue
                serving_g = max(10.0, daily_amount * frac)

                foods = self.recommender.recommend_foods(
                    food_group=group,
                    portion_grams=serving_g,
                    risk_scores=risk_scores,
                    region=region,
                    is_veg=is_veg,
                    meal_type=meal_name,
                    already_used=used_food_ids,
                    top_k=1,
                )

                for food in foods:
                    meal_items.append(food)
                    used_food_ids.append(food["food_id"])
                    meal_kcal += food["kcal"]
                    total_protein += food.get("protein_g", 0)
                    total_fiber += food.get("fiber_g", 0)
                    total_sodium += food.get("sodium_mg", 0)
                    total_omega3 += food.get("omega3_g", 0)

            total_kcal += meal_kcal

            meals_out[meal_name] = {
                "total_kcal": round(meal_kcal, 1),
                "items": meal_items,
                "meal_summary": _meal_summary(meal_name, meal_items, risk_scores),
            }

        # Estimate potassium from items
        for meal_data in meals_out.values():
            for item in meal_data["items"]:
                food_rows = self.recommender.df[self.recommender.df["food_id"] == item["food_id"]]
                if not food_rows.empty:
                    total_potassium += float(food_rows.iloc[0]["potassium_mg"]) * item["grams"] / 100

        # ── Plate proportion summary ─────────────────────────────────────────
        if total_kcal > 0:
            plate_macros = {"carbs": 0, "protein": 0, "fat": 0}
            for meal_data in meals_out.values():
                for item in meal_data["items"]:
                    row = self.recommender.df[self.recommender.df["food_id"] == item["food_id"]]
                    if row.empty:
                        continue
                    row = row.iloc[0]
                    g = item["grams"]
                    plate_macros["carbs"]   += row["carbs_g"] * g / 100 * 4
                    plate_macros["protein"] += row["protein_g"] * g / 100 * 4
                    plate_macros["fat"]     += row["fat_g"] * g / 100 * 9
            macro_total = sum(plate_macros.values()) or 1
            plate_proportions = {k: round(v / macro_total * 100, 1) for k, v in plate_macros.items()}
        else:
            plate_proportions = {"carbs": 55.0, "protein": 15.0, "fat": 30.0}

        daily_summary = {
            "total_kcal": round(total_kcal, 1),
            "protein_g": round(total_protein, 1),
            "fiber_g": round(total_fiber, 1),
            "sodium_mg": round(total_sodium, 1),
            "potassium_mg": round(total_potassium, 1),
            "omega3_g": round(total_omega3, 2),
        }

        return {
            "daily_summary": daily_summary,
            "plate_proportions": plate_proportions,
            "meals": meals_out,
            "foods_to_avoid": _get_avoids(risk_scores),
            "foods_to_add_more": _get_add_more(risk_scores, is_veg),
            "nutrient_gaps": _get_nutrient_gaps(daily_summary, portions),
        }
