from typing import List, Optional


def calculate_amplification(
    stress_level: int,
    sleep_hours: float,
    phq9_score: int,
    gad7_score: int,
    diabetes_risk: Optional[float] = None,
    hypertension_risk: Optional[float] = None,
    cvd_risk: Optional[float] = None,
) -> List[str]:
    amplifiers = []

    # Stress → Diabetes (cortisol-mediated insulin resistance)
    if stress_level > 7:
        pct = (stress_level - 5) * 3
        amplifiers.append(
            f"🧠➡️🩸 **Stress-Diabetes Link**: Your stress level ({stress_level}/10) is elevating cortisol, "
            f"which directly drives gluconeogenesis and insulin resistance. "
            f"This adds an estimated +{pct}% to your diabetes risk beyond baseline lifestyle factors. "
            f"(Source: Kivimaki 2012, Lancet — work stress raises T2D risk by 45%)"
        )

    # Sleep deprivation → Hypertension
    if sleep_hours < 6:
        pct = round((6 - sleep_hours) * 8)
        amplifiers.append(
            f"😴➡️❤️ **Sleep-Blood Pressure Link**: Sleeping only {sleep_hours}h/night suppresses "
            f"nocturnal BP dipping and activates your sympathetic nervous system. "
            f"This adds an estimated +{pct}% to your hypertension risk. "
            f"(Source: ESH Guidelines 2023 — <6h sleep raises hypertension risk by 20-32%)"
        )

    # Depression → CVD (inflammatory pathway)
    if phq9_score > 10:
        pct = (phq9_score - 9) * 4
        amplifiers.append(
            f"💔➡️🫀 **Depression-CVD Link**: Your PHQ-9 score ({phq9_score}/27) indicates depression, "
            f"which chronically elevates inflammatory markers (IL-6, CRP) and activates platelet aggregation. "
            f"This adds an estimated +{pct}% to your cardiovascular risk. "
            f"(Source: Rugulies 2002 — depression raises CVD risk by 60-80%)"
        )

    # Anxiety → Hypertension (sympathetic activation)
    if gad7_score > 10:
        pct = (gad7_score - 9) * 3
        amplifiers.append(
            f"😰➡️🩺 **Anxiety-Hypertension Link**: Your GAD-7 score ({gad7_score}/21) indicates anxiety, "
            f"which chronically activates your HPA axis and raises sympathetic tone. "
            f"This adds an estimated +{pct}% to your hypertension risk. "
            f"(Source: APA Clinical Guidelines 2022 — anxiety raises baseline cortisol and CRP)"
        )

    # High stress + poor sleep compounding effect
    if stress_level >= 7 and sleep_hours < 6:
        amplifiers.append(
            f"⚡ **Compounding Effect**: High stress AND poor sleep together create a synergistic risk cycle — "
            f"stress disrupts sleep, poor sleep worsens stress reactivity, both elevate cortisol. "
            f"Breaking one (improving sleep) significantly helps the other."
        )

    if not amplifiers:
        amplifiers.append(
            "✅ Your mental health profile does not appear to be significantly amplifying your physical disease risks. "
            "Maintaining your current stress management and sleep quality is key to prevention."
        )

    return amplifiers
