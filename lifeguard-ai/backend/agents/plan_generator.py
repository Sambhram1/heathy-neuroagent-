from typing import List, Optional


def generate_prevention_plan(
    risk_scores: dict,
    top_risk_factors: List[str],
    retrieved_evidence: Optional[List[str]] = None,
    user_context: Optional[str] = None,
) -> dict:
    retrieved_evidence = retrieved_evidence or []
    diabetes = risk_scores.get("diabetes_risk", 0)
    hypertension = risk_scores.get("hypertension_risk", 0)
    cvd = risk_scores.get("cvd_risk", 0)
    mental = risk_scores.get("mental_health_index", 0)

    plan = {
        "priority_actions": [],
        "nutrition": [],
        "exercise": [],
        "sleep_stress": [],
        "mental_wellness": [],
        "see_a_doctor": [],
        "evidence_citations": retrieved_evidence[:5],
    }

    # ── PRIORITY ACTIONS (Top 30-day goals) ─────────────────────────────────────
    if diabetes > 40:
        plan["priority_actions"].append(
            "Start a 30-minute post-dinner walk every day this week. Studies show this alone reduces postprandial glucose by 22%."
        )
        plan["priority_actions"].append(
            "Replace one serving of white rice or maida with a millet option (jowar roti, ragi mudde, or bajra chapati) daily."
        )
    if hypertension > 40:
        plan["priority_actions"].append(
            "Reduce added salt by 1 teaspoon daily — this alone can lower systolic BP by 5-6 mmHg within 4 weeks."
        )
    if cvd > 40:
        plan["priority_actions"].append(
            "Add 1 handful of akhrot (walnuts) or 1 tablespoon of alsi (flaxseed) powder to your diet daily for omega-3 intake."
        )
    if mental > 40:
        plan["priority_actions"].append(
            "Begin a 10-minute guided meditation or pranayama practice each morning this week — free apps: Headspace, Calm, or YouTube 'Anulom Vilom'."
        )
    plan["priority_actions"].append(
        "Schedule a health check-up within the next 4 weeks: fasting glucose, lipid profile, BP measurement, and BMI."
    )

    # ── NUTRITION ────────────────────────────────────────────────────────────────
    plan["nutrition"].append({
        "recommendation": "Adopt the ICMR Plate: 45% millets/whole grains, 20% protein (dal, paneer, eggs, fish), 30% healthy fats, 5% natural sugars.",
        "why": "India-specific dietary pattern shown to prevent metabolic syndrome at population level (ICMR 2024).",
        "source": "ICMR Dietary Guidelines 2024",
    })
    if diabetes > 35:
        plan["nutrition"].append({
            "recommendation": "Consume 2 tablespoons of soaked methi seeds each morning. Soak overnight, swallow with water.",
            "why": "Reduces postprandial glucose and improves insulin sensitivity. HbA1c reduction of 0.8% in 8 weeks.",
            "source": "Indian Journal of Physiology 2009",
        })
        plan["nutrition"].append({
            "recommendation": "Include rajma, chana, or moong dal in at least one meal daily for high-fiber, low-GI protein.",
            "why": "25g+ dietary fiber/day associated with 18% lower T2D risk (ADA 2023).",
            "source": "ADA Nutrition Guidelines 2023",
        })
    if hypertension > 35:
        plan["nutrition"].append({
            "recommendation": "Switch to low-sodium alternatives: sendha namak (rock salt) in smaller quantities, and avoid pickles/papad/processed snacks.",
            "why": "Indian diets average 10-12g sodium/day; WHO recommends 5g. Each 2g reduction = 5-6 mmHg BP improvement.",
            "source": "DASH Trial, NEJM 2001",
        })
    if cvd > 35:
        plan["nutrition"].append({
            "recommendation": "Eat sardiines, rohu, or katla fish 2x per week for omega-3 fatty acids. Vegetarian: 1 tbsp alsi (flaxseed) powder daily.",
            "why": "Omega-3s reduce triglycerides 15-30% and CVD events by 25% (AHA 2022).",
            "source": "AHA Scientific Statement 2022",
        })
    plan["nutrition"].append({
        "recommendation": "Add 1 tsp turmeric (haldi) to daily cooking — a golden latte or turmeric dal is ideal.",
        "why": "Curcumin reduces IL-6 by 14% and CRP by 9%, protecting against chronic inflammation underlying all metabolic diseases.",
        "source": "Nutrients 2021",
    })

    # ── EXERCISE ─────────────────────────────────────────────────────────────────
    plan["exercise"].append({
        "recommendation": "Week 1-2: 20-min brisk walk after dinner, 5 days/week. Week 3-4: Increase to 30-45 min.",
        "why": "150 min/week moderate activity reduces diabetes risk 35-40% and systolic BP by 5-8 mmHg (WHO 2018, AHA 2017).",
        "source": "WHO Global Action Plan 2018",
    })
    plan["exercise"].append({
        "recommendation": "Add 12 rounds of Surya Namaskar 3 mornings/week. Each set = 25-30 minutes moderate aerobic exercise.",
        "why": "Reduces BMI by 1.5 kg/m² over 12 weeks and improves cardiovascular fitness (Yoga Research Foundation 2019).",
        "source": "Yoga Research Foundation 2019",
    })
    if cvd > 50 or hypertension > 50:
        plan["exercise"].append({
            "recommendation": "Avoid high-intensity exercise until your BP is checked. Start with gentle walking and yoga until cleared by a doctor.",
            "why": "Safety-first for elevated CVD/hypertension risk. Gradual progression is evidence-based.",
            "source": "AHA/ACC 2017 Guidelines",
        })

    # ── SLEEP & STRESS ───────────────────────────────────────────────────────────
    plan["sleep_stress"].append({
        "recommendation": "Set a consistent sleep schedule: same bedtime (10-10:30 PM) and wake time (6-6:30 AM), even on weekends.",
        "why": "Sleep consistency regulates circadian cortisol rhythm, which directly reduces insulin resistance and BP elevation.",
        "source": "ESH Guidelines 2023",
    })
    plan["sleep_stress"].append({
        "recommendation": "Practice 15 minutes of Anulom-Vilom (alternate nostril breathing) before bed. 6 breaths/minute pace.",
        "why": "Pranayama at 6 breaths/min reduces systolic BP by 6.5 mmHg and activates the parasympathetic nervous system (IJY 2014).",
        "source": "International Journal of Yoga 2014",
    })
    plan["sleep_stress"].append({
        "recommendation": "Remove screens (phone, laptop) 45 minutes before sleep. Use blue-light glasses if unavoidable.",
        "why": "Blue light suppresses melatonin, disrupts sleep onset, and increases next-day cortisol levels.",
        "source": "Sleep Foundation Clinical Review 2023",
    })

    # ── MENTAL WELLNESS ──────────────────────────────────────────────────────────
    plan["mental_wellness"].append({
        "recommendation": "Begin 20-minute daily meditation (Vipassana, mindfulness, or guided apps). Track mood in a journal.",
        "why": "20-min daily meditation reduces perceived stress by 31% and lowers cortisol by 18% after 8 weeks (JAMA Psychiatry 2014).",
        "source": "JAMA Psychiatry 2014",
    })
    plan["mental_wellness"].append({
        "recommendation": "Schedule at least one social activity per week — meeting a friend, family dinner, or community group.",
        "why": "Social isolation increases all-cause mortality by 29% — equivalent to smoking 15 cigarettes/day (Holt-Lunstad 2015).",
        "source": "Holt-Lunstad 2015",
    })
    if mental > 50:
        plan["mental_wellness"].append({
            "recommendation": "Consider speaking with a counsellor or psychologist. iCall (TISS) offers affordable online sessions: 9152987821.",
            "why": "Professional support for moderate+ mental health scores prevents escalation to severe illness and reduces physical disease amplification.",
            "source": "NICE Guidelines 2022",
        })

    # ── SEE A DOCTOR ─────────────────────────────────────────────────────────────
    plan["see_a_doctor"].append(
        "**Schedule within 4 weeks**: Fasting glucose, HbA1c, full lipid profile, BP measurement — baseline data for all risk tracking."
    )
    if diabetes > 60:
        plan["see_a_doctor"].append(
            "⚠️ **Diabetes risk is HIGH**: Consult your doctor for an oral glucose tolerance test (OGTT) and formal diabetes screening."
        )
    if hypertension > 60:
        plan["see_a_doctor"].append(
            "⚠️ **Hypertension risk is HIGH**: Get your BP measured on 3 separate days. If systolic >140 on any reading, consult a physician immediately."
        )
    if cvd > 60:
        plan["see_a_doctor"].append(
            "⚠️ **CVD risk is HIGH**: Request an ECG, echocardiogram, and cardiac risk panel (hsCRP, LDL, apolipoprotein B) from your doctor."
        )
    if mental > 60:
        plan["see_a_doctor"].append(
            "⚠️ **Mental health index is HIGH**: Please consider speaking with a licensed mental health professional. "
            "iCall: 9152987821 | Vandrevala: 1860-2662-345"
        )
    plan["see_a_doctor"].append(
        "**Recheck in 3 months**: After implementing lifestyle changes, retest fasting glucose and BP to track improvement."
    )

    return plan
