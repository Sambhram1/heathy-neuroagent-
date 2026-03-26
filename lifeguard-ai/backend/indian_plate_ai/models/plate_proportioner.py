"""
Layer 1 — PlateProportioner
Calculates ICMR-compliant daily food group portion targets adjusted for
the user's specific risk scores, calorie target, age, and sex.
"""

import math


class PlateProportioner:
    # ICMR-NIN 2024 base plate for 2000 kcal reference
    BASE_PORTIONS = {
        "vegetables_g": 400,
        "fruits_g": 100,
        "cereals_g": 250,
        "pulses_protein_g": 85,
        "dairy_ml": 300,
        "nuts_seeds_g": 35,
        "fats_g": 27,
    }

    def calculate_portions(
        self,
        risk_scores: dict,
        calorie_target: int,
        age: int,
        sex: str,
    ) -> dict:
        """
        Returns a dict with adjusted portion targets and nutrient flags.

        risk_scores keys: diabetes, hypertension, cvd, mental (0-100 each)
        """
        # ── Copy base portions ──────────────────────────────────────────────
        p = dict(self.BASE_PORTIONS)

        d_f = risk_scores.get("diabetes", 0) / 100
        h_f = risk_scores.get("hypertension", 0) / 100
        c_f = risk_scores.get("cvd", 0) / 100
        m_f = risk_scores.get("mental", 0) / 100

        # ── Diabetes adjustments ────────────────────────────────────────────
        p["cereals_g"] = p["cereals_g"] * (1 - 0.30 * d_f)
        p["pulses_protein_g"] = p["pulses_protein_g"] * (1 + 0.20 * d_f)
        p["vegetables_g"] = p["vegetables_g"] * (1 + 0.10 * d_f)
        millet_ratio = 0.5 + 0.4 * d_f   # 50–90% of cereals should be millets

        # ── Hypertension adjustments ────────────────────────────────────────
        sodium_limit_mg = int(2000 - 1200 * h_f)     # 2000 → 800 mg/day
        potassium_target_mg = int(2000 + 1500 * h_f) # 2000 → 3500 mg/day
        p["dairy_ml"] = p["dairy_ml"] * (1 + 0.1 * h_f)

        # ── CVD adjustments ─────────────────────────────────────────────────
        p["fats_g"] = p["fats_g"] * (1 - 0.3 * c_f)
        p["nuts_seeds_g"] = p["nuts_seeds_g"] * (1 + 0.4 * c_f)
        omega3_target_g = 1.0 + 1.5 * c_f

        # ── Mental health adjustments ───────────────────────────────────────
        probiotic_servings = 1 + int(m_f * 2)
        magnesium_target_mg = 300 + int(100 * m_f)

        # ── Scale to user's calorie target ──────────────────────────────────
        scale = calorie_target / 2000
        scaled = {k: round(v * scale, 1) for k, v in p.items()}

        # ── Age/sex micro-adjustments ────────────────────────────────────────
        if sex.lower() in ("female", "f") and age < 50:
            # Extra iron needs — boost pulses
            scaled["pulses_protein_g"] = round(scaled["pulses_protein_g"] * 1.1, 1)
        if age >= 60:
            # Bone health — boost dairy & protein
            scaled["dairy_ml"] = round(scaled["dairy_ml"] * 1.15, 1)
            scaled["pulses_protein_g"] = round(scaled["pulses_protein_g"] * 1.1, 1)

        return {
            **scaled,
            "millet_ratio": round(min(0.9, millet_ratio), 2),
            "sodium_limit_mg": sodium_limit_mg,
            "potassium_target_mg": potassium_target_mg,
            "omega3_target_g": round(omega3_target_g, 2),
            "probiotic_servings": probiotic_servings,
            "magnesium_target_mg": magnesium_target_mg,
            "calorie_target": calorie_target,
        }
