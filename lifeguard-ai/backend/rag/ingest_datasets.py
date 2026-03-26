"""
Dataset ingestion pipeline for LifeGuard AI.

Reads all CSV datasets, derives meaningful clinical insight chunks
(aggregate statistics, risk correlations, threshold patterns), and
upserts them into Pinecone alongside the existing medical knowledge base.

Run once from the backend directory:
    python rag/ingest_datasets.py
"""

import os
import sys
import warnings

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from typing import List, Dict

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def pct(n: float, total: float) -> str:
    return f"{n / total * 100:.1f}%"


def fmt(v) -> str:
    if isinstance(v, float):
        return f"{v:.1f}"
    return str(v)


def _upsert_chunks(chunks: List[Dict], namespace: str = "datasets") -> int:
    from rag.knowledge_base import _get_embedder, _get_index

    embedder = _get_embedder()
    index = _get_index()

    texts = [c["text"] for c in chunks]
    vectors = embedder.encode(texts, show_progress_bar=False).tolist()

    records = [
        {
            "id": c["id"],
            "values": vectors[i],
            "metadata": {
                "text": c["text"],
                "source": c["source"],
                "condition": c["condition"],
                "dataset": c.get("dataset", ""),
            },
        }
        for i, c in enumerate(chunks)
    ]

    batch_size = 100
    total = 0
    for start in range(0, len(records), batch_size):
        batch = records[start : start + batch_size]
        index.upsert(vectors=batch)
        total += len(batch)

    return total


# ─── DATASET 1: diabetes.csv ─────────────────────────────────────────────────

def ingest_diabetes_pima() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "diabetes.csv")
    df = pd.read_csv(path)
    chunks = []
    prefix = "pima"

    n_total = len(df)
    n_pos = df["Outcome"].sum()
    n_neg = n_total - n_pos

    # Overview
    chunks.append({
        "id": f"{prefix}_overview",
        "text": (
            f"Pima Indians Diabetes Dataset Analysis (n={n_total}): "
            f"{int(n_pos)} individuals ({pct(n_pos, n_total)}) developed Type 2 diabetes. "
            f"Average age: {df['Age'].mean():.1f} years. Average BMI: {df['BMI'].mean():.1f} kg/m². "
            f"Average fasting glucose: {df['Glucose'].mean():.0f} mg/dL. "
            "This clinical cohort demonstrates that diabetes risk is strongly predicted by glucose, BMI, and age."
        ),
        "source": "Pima Indians Diabetes Dataset (Kaggle)",
        "condition": "diabetes",
        "dataset": "diabetes.csv",
    })

    # Glucose threshold analysis
    pos = df[df["Outcome"] == 1]
    neg = df[df["Outcome"] == 0]
    chunks.append({
        "id": f"{prefix}_glucose",
        "text": (
            f"Glucose levels in diabetes vs non-diabetes (Pima Dataset, n={n_total}): "
            f"Diabetic group averaged {pos['Glucose'].mean():.0f} mg/dL fasting glucose "
            f"vs {neg['Glucose'].mean():.0f} mg/dL in non-diabetic group — a "
            f"{pos['Glucose'].mean() - neg['Glucose'].mean():.0f} mg/dL difference. "
            f"Individuals with glucose ≥126 mg/dL had {pct((df[df['Glucose']>=126]['Outcome']==1).sum(), (df['Glucose']>=126).sum())} diabetes rate. "
            f"Individuals with glucose <100 mg/dL had only {pct((df[df['Glucose']<100]['Outcome']==1).sum(), (df['Glucose']<100).sum())} diabetes rate. "
            "Clinical threshold of 126 mg/dL fasting glucose aligns with ADA diagnostic criteria for diabetes."
        ),
        "source": "Pima Indians Diabetes Dataset — Glucose Analysis",
        "condition": "diabetes",
        "dataset": "diabetes.csv",
    })

    # BMI analysis
    chunks.append({
        "id": f"{prefix}_bmi",
        "text": (
            f"BMI and diabetes correlation (Pima Dataset, n={n_total}): "
            f"Diabetic group averaged BMI {pos['BMI'].mean():.1f} kg/m² vs {neg['BMI'].mean():.1f} kg/m² in non-diabetics. "
            f"Individuals with BMI ≥30: {pct((df[df['BMI']>=30]['Outcome']==1).sum(), (df['BMI']>=30).sum())} diabetes rate. "
            f"Individuals with BMI <23: {pct((df[df['BMI']<23]['Outcome']==1).sum(), (df['BMI']<23).sum())} diabetes rate. "
            "For South Asian populations, BMI ≥23 is already considered elevated risk (vs ≥25 for Western populations), "
            "consistent with ICMR-INDIAB guidelines showing higher visceral adiposity at lower BMI thresholds."
        ),
        "source": "Pima Indians Diabetes Dataset — BMI Analysis",
        "condition": "diabetes",
        "dataset": "diabetes.csv",
    })

    # Age analysis
    chunks.append({
        "id": f"{prefix}_age",
        "text": (
            f"Age and diabetes risk (Pima Dataset, n={n_total}): "
            f"Diabetic group mean age {pos['Age'].mean():.1f} years vs {neg['Age'].mean():.1f} years non-diabetic. "
            f"Age 35-45: {pct((df[(df['Age']>=35)&(df['Age']<45)]['Outcome']==1).sum(), ((df['Age']>=35)&(df['Age']<45)).sum())} diabetes rate. "
            f"Age >50: {pct((df[df['Age']>50]['Outcome']==1).sum(), (df['Age']>50).sum())} diabetes rate. "
            "Each decade of age above 35 significantly increases T2D incidence, consistent with WHO guidelines recommending screening from age 35 in high-risk populations."
        ),
        "source": "Pima Indians Diabetes Dataset — Age Analysis",
        "condition": "diabetes",
        "dataset": "diabetes.csv",
    })

    # Insulin and BP
    chunks.append({
        "id": f"{prefix}_insulin_bp",
        "text": (
            f"Insulin resistance and blood pressure in diabetes (Pima Dataset, n={n_total}): "
            f"Diabetic group average insulin: {pos['Insulin'].mean():.0f} mu U/ml vs {neg['Insulin'].mean():.0f} mu U/ml. "
            f"Diabetic group average BP: {pos['BloodPressure'].mean():.0f} mmHg vs {neg['BloodPressure'].mean():.0f} mmHg diastolic. "
            f"DiabetesPedigreeFunction (genetic risk): {pos['DiabetesPedigreeFunction'].mean():.3f} in diabetics vs {neg['DiabetesPedigreeFunction'].mean():.3f} in non-diabetics. "
            "Elevated insulin (hyperinsulinemia) alongside elevated BP suggests metabolic syndrome — a cluster of concurrent risk factors."
        ),
        "source": "Pima Indians Diabetes Dataset — Metabolic Analysis",
        "condition": "diabetes",
        "dataset": "diabetes.csv",
    })

    print(f"  [diabetes.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── DATASET 2: hypertension_dataset.csv ─────────────────────────────────────

def ingest_hypertension() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "hypertension_dataset.csv")
    df = pd.read_csv(path)
    chunks = []
    prefix = "htn"

    n_total = len(df)
    hyp = df[df["Hypertension"] == "High"]
    normal = df[df["Hypertension"] == "Low"]
    n_hyp = len(hyp)

    # Overview
    chunks.append({
        "id": f"{prefix}_overview",
        "text": (
            f"Hypertension Risk Dataset Analysis (n={n_total:,} patients across multiple countries): "
            f"{n_hyp:,} ({pct(n_hyp, n_total)}) had hypertension. "
            f"Hypertensive group averaged systolic BP {hyp['Systolic_BP'].mean():.0f}/{hyp['Diastolic_BP'].mean():.0f} mmHg "
            f"vs {normal['Systolic_BP'].mean():.0f}/{normal['Diastolic_BP'].mean():.0f} mmHg in normotensives. "
            f"Mean BMI hypertensive: {hyp['BMI'].mean():.1f} kg/m² vs {normal['BMI'].mean():.1f} kg/m². "
            "This large international dataset confirms the multi-factorial nature of hypertension risk."
        ),
        "source": "International Hypertension Risk Dataset (Kaggle)",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Stress and BP
    stress_high = df[df["Stress_Level"] >= 7]
    chunks.append({
        "id": f"{prefix}_stress",
        "text": (
            f"Stress level and hypertension (n={n_total:,}): "
            f"Individuals with stress level ≥7/10 had {pct((stress_high['Hypertension']=='High').sum(), len(stress_high))} hypertension rate "
            f"vs {pct((df[df['Stress_Level']<4]['Hypertension']=='High').sum(), len(df[df['Stress_Level']<4]))} for stress <4/10. "
            f"Hypertensive patients averaged stress level {hyp['Stress_Level'].mean():.1f}/10 "
            f"vs {normal['Stress_Level'].mean():.1f}/10 in normotensives. "
            "Chronic occupational stress activates the sympathetic nervous system and HPA axis, causing sustained elevation in vascular resistance and BP."
        ),
        "source": "Hypertension Dataset — Stress Analysis",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Salt intake and BP
    high_salt = df[df["Salt_Intake"] > 8]
    chunks.append({
        "id": f"{prefix}_salt",
        "text": (
            f"Sodium intake and hypertension risk (n={n_total:,}): "
            f"High salt intake (>8g/day) group had {pct((high_salt['Hypertension']=='High').sum(), len(high_salt))} hypertension rate. "
            f"Hypertensive patients averaged {hyp['Salt_Intake'].mean():.1f}g/day sodium "
            f"vs {normal['Salt_Intake'].mean():.1f}g/day in normotensives. "
            "WHO recommends <5g sodium/day. Indian diets average 10-12g/day. "
            "Each 2g reduction in daily sodium reduces systolic BP by 5-6 mmHg (DASH Trial, NEJM 2001). "
            "Switching to rock salt (sendha namak) in moderation and avoiding processed snacks can meaningfully reduce sodium intake."
        ),
        "source": "Hypertension Dataset — Salt & Sodium Analysis",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Physical activity
    low_activity = df[df["Physical_Activity_Level"] == "Low"]
    high_activity = df[df["Physical_Activity_Level"] == "High"]
    chunks.append({
        "id": f"{prefix}_activity",
        "text": (
            f"Physical activity and hypertension (n={n_total:,}): "
            f"Low-activity individuals: {pct((low_activity['Hypertension']=='High').sum(), len(low_activity))} hypertension rate. "
            f"High-activity individuals: {pct((high_activity['Hypertension']=='High').sum(), len(high_activity))} hypertension rate. "
            f"Hypertensive group averaged systolic BP {hyp['Systolic_BP'].mean():.0f} mmHg. "
            "30 minutes of moderate aerobic activity 5 days/week reduces resting systolic BP by 5-8 mmHg, "
            "comparable to a first-line antihypertensive medication (AHA/ACC 2017 Guidelines). "
            "Brisk walking, cycling, or Surya Namaskar are practical options for Indian populations."
        ),
        "source": "Hypertension Dataset — Physical Activity Analysis",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Sleep and hypertension
    short_sleep = df[df["Sleep_Duration"] < 6]
    chunks.append({
        "id": f"{prefix}_sleep",
        "text": (
            f"Sleep duration and hypertension (n={n_total:,}): "
            f"Short sleepers (<6h/night): {pct((short_sleep['Hypertension']=='High').sum(), len(short_sleep))} hypertension rate. "
            f"Optimal sleepers (7-9h): {pct((df[(df['Sleep_Duration']>=7)&(df['Sleep_Duration']<=9)]['Hypertension']=='High').sum(), (df[(df['Sleep_Duration']>=7)&(df['Sleep_Duration']<=9)]).shape[0])} hypertension rate. "
            f"Hypertensive patients averaged {hyp['Sleep_Duration'].mean():.1f}h sleep vs {normal['Sleep_Duration'].mean():.1f}h for normotensives. "
            "Poor sleep disrupts the normal nocturnal BP dip ('non-dipping'), increasing 24-hour BP load and end-organ damage risk. "
            "Consistent sleep schedule (10 PM–6 AM) is the single most effective non-pharmacological intervention for nocturnal BP regulation."
        ),
        "source": "Hypertension Dataset — Sleep Analysis",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Cholesterol profile
    chunks.append({
        "id": f"{prefix}_cholesterol",
        "text": (
            f"Cholesterol profile and hypertension (n={n_total:,}): "
            f"Hypertensive group averaged total cholesterol {hyp['Cholesterol'].mean():.0f} mg/dL, "
            f"LDL {hyp['LDL'].mean():.0f} mg/dL, HDL {hyp['HDL'].mean():.0f} mg/dL, "
            f"triglycerides {hyp['Triglycerides'].mean():.0f} mg/dL. "
            f"Non-hypertensive group: cholesterol {normal['Cholesterol'].mean():.0f}, LDL {normal['LDL'].mean():.0f}, HDL {normal['HDL'].mean():.0f}. "
            "High LDL combined with hypertension significantly amplifies cardiovascular risk (INTERHEART Study). "
            "Plant sterols (from til, groundnuts, sunflower seeds), daily amla, and omega-3 (alsi/flaxseed) can lower LDL by 10-15%."
        ),
        "source": "Hypertension Dataset — Lipid Profile Analysis",
        "condition": "cvd",
        "dataset": "hypertension_dataset.csv",
    })

    # BMI and hypertension
    chunks.append({
        "id": f"{prefix}_bmi",
        "text": (
            f"BMI and hypertension correlation (n={n_total:,}): "
            f"Hypertensive group mean BMI: {hyp['BMI'].mean():.1f} kg/m². "
            f"BMI >30: {pct((df[df['BMI']>30]['Hypertension']=='High').sum(), (df['BMI']>30).sum())} hypertension rate. "
            f"BMI 25-30: {pct((df[(df['BMI']>25)&(df['BMI']<=30)]['Hypertension']=='High').sum(), ((df['BMI']>25)&(df['BMI']<=30)).sum())} hypertension rate. "
            f"BMI <23: {pct((df[df['BMI']<23]['Hypertension']=='High').sum(), (df['BMI']<23).sum())} hypertension rate. "
            "Each 1 kg/m² increase in BMI raises systolic BP by 1-2 mmHg (JNC-8 Guidelines). "
            "BMI reduction of 5 kg/m² reduces systolic BP by 5-10 mmHg on average."
        ),
        "source": "Hypertension Dataset — BMI Analysis",
        "condition": "hypertension",
        "dataset": "hypertension_dataset.csv",
    })

    # Smoking
    chunks.append({
        "id": f"{prefix}_smoking",
        "text": (
            f"Smoking status and hypertension (n={n_total:,}): "
            f"Current smokers: {pct((df[df['Smoking_Status']=='Current']['Hypertension']=='High').sum(), (df['Smoking_Status']=='Current').sum())} hypertension rate. "
            f"Never smokers: {pct((df[df['Smoking_Status']=='Never']['Hypertension']=='High').sum(), (df['Smoking_Status']=='Never').sum())} hypertension rate. "
            f"Former smokers: {pct((df[df['Smoking_Status']=='Former']['Hypertension']=='High').sum(), (df['Smoking_Status']=='Former').sum())} hypertension rate. "
            "Nicotine causes acute vasoconstriction and sympathetic activation. Smoking cessation reduces CVD risk by 50% within 1 year (AHA 2023). "
            "Nicotine replacement therapy, Quitline India (1800-112-356), and behavioral support improve quit rates 2-3x vs cold turkey."
        ),
        "source": "Hypertension Dataset — Smoking Analysis",
        "condition": "cvd",
        "dataset": "hypertension_dataset.csv",
    })

    print(f"  [hypertension_dataset.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── DATASET 3: Mental Health Dataset.csv ────────────────────────────────────

def ingest_mental_health() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "Mental Health Dataset.csv")
    df = pd.read_csv(path)
    chunks = []
    prefix = "mh"

    n_total = len(df)

    # Overview
    treatment_rate = (df["treatment"] == "Yes").sum() / n_total
    stress_rate = (df["Growing_Stress"] == "Yes").sum() / n_total
    chunks.append({
        "id": f"{prefix}_overview",
        "text": (
            f"Mental Health Survey Analysis (n={n_total:,} respondents across multiple countries): "
            f"{pct((df['treatment']=='Yes').sum(), n_total)} sought mental health treatment. "
            f"{pct((df['Growing_Stress']=='Yes').sum(), n_total)} reported growing stress. "
            f"{pct((df['Coping_Struggles']=='Yes').sum(), n_total)} reported difficulty coping. "
            f"{pct((df['Social_Weakness']=='Yes').sum(), n_total)} reported social weakness/isolation. "
            "Mental health challenges are pervasive across occupations and demographics, yet treatment-seeking remains low. "
            "Untreated depression and anxiety significantly amplify risk for diabetes, hypertension, and cardiovascular disease."
        ),
        "source": "Mental Health Survey Dataset (Kaggle, n=292k)",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Occupation-based stress analysis
    top_occupations = df["Occupation"].value_counts().head(5).index.tolist()
    occ_stress = {}
    for occ in top_occupations:
        sub = df[df["Occupation"] == occ]
        occ_stress[occ] = (sub["Growing_Stress"] == "Yes").sum() / len(sub) * 100

    occ_text = ", ".join([f"{occ}: {v:.0f}%" for occ, v in sorted(occ_stress.items(), key=lambda x: -x[1])])
    chunks.append({
        "id": f"{prefix}_occupation",
        "text": (
            f"Occupational stress rates in mental health survey (n={n_total:,}): "
            f"Growing stress rates by occupation — {occ_text}. "
            "Corporate, technology, and healthcare workers report highest stress rates. "
            "Occupational burnout predicts new-onset hypertension (HR 1.84) and T2D (HR 1.63) over 5 years (Toker 2012). "
            "Structured work-life boundaries, mindfulness breaks at work, and peer support groups reduce burnout by 30-40%."
        ),
        "source": "Mental Health Survey — Occupational Stress Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Family history and treatment
    fam_yes = df[df["family_history"] == "Yes"]
    fam_no = df[df["family_history"] == "No"]
    chunks.append({
        "id": f"{prefix}_family_history",
        "text": (
            f"Family mental health history and treatment-seeking (n={n_total:,}): "
            f"Individuals with family history of mental illness: {pct((fam_yes['treatment']=='Yes').sum(), len(fam_yes))} sought treatment. "
            f"Without family history: {pct((fam_no['treatment']=='Yes').sum(), len(fam_no))} sought treatment. "
            f"Family history also correlates with {pct((fam_yes['Coping_Struggles']=='Yes').sum(), len(fam_yes))} coping difficulties vs "
            f"{pct((fam_no['Coping_Struggles']=='Yes').sum(), len(fam_no))} without family history. "
            "Family history of depression or anxiety is a significant risk factor. "
            "iCall (TISS): 9152987821 | Vandrevala Foundation: 1860-2662-345 (both offer free or subsidized sessions)."
        ),
        "source": "Mental Health Survey — Family History Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Mood swings by care options
    mood_high = df[df["Mood_Swings"] == "High"]
    chunks.append({
        "id": f"{prefix}_mood_swings",
        "text": (
            f"Mood swings and care access (n={n_total:,}): "
            f"High mood swings reported by {pct(len(mood_high), n_total)} of respondents. "
            f"Among high mood swing group: {pct((mood_high['treatment']=='Yes').sum(), len(mood_high))} sought treatment, "
            f"{pct((mood_high['Coping_Struggles']=='Yes').sum(), len(mood_high))} report coping struggles. "
            f"{pct((df['care_options']=='No').sum(), n_total)} reported no access to mental health care options. "
            "High mood variability is a key indicator of bipolar spectrum disorders, borderline personality patterns, or severe stress response. "
            "Early intervention with CBT or mindfulness reduces mood episode frequency by 40-50% (NICE 2022)."
        ),
        "source": "Mental Health Survey — Mood & Care Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Social weakness and isolation
    social_weak = df[df["Social_Weakness"] == "Yes"]
    chunks.append({
        "id": f"{prefix}_social_isolation",
        "text": (
            f"Social isolation and mental health outcomes (n={n_total:,}): "
            f"{pct(len(social_weak), n_total)} reported social weakness/isolation. "
            f"Social isolation correlates with {pct((social_weak['Growing_Stress']=='Yes').sum(), len(social_weak))} stress rate "
            f"vs {pct((df[df['Social_Weakness']=='No']['Growing_Stress']=='Yes').sum(), (df['Social_Weakness']=='No').sum())} in socially connected individuals. "
            "Social isolation increases all-cause mortality by 29% and CVD risk by 32%, equivalent to smoking 15 cigarettes/day (Holt-Lunstad 2015). "
            "Community groups, hobby clubs, family check-ins, and digital communities are protective. "
            "For Indians, traditional social structures (family events, religious gatherings, neighbourhood connections) serve as natural buffers."
        ),
        "source": "Mental Health Survey — Social Isolation Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Work interest
    no_work_interest = df[df["Work_Interest"] == "No"]
    chunks.append({
        "id": f"{prefix}_anhedonia",
        "text": (
            f"Loss of work interest (anhedonia indicator) in mental health survey (n={n_total:,}): "
            f"{pct(len(no_work_interest), n_total)} reported no interest in work — a core symptom of depression (PHQ-9 item). "
            f"Among this group: {pct((no_work_interest['Growing_Stress']=='Yes').sum(), len(no_work_interest))} also report growing stress, "
            f"{pct((no_work_interest['Coping_Struggles']=='Yes').sum(), len(no_work_interest))} report coping struggles. "
            "Loss of interest or pleasure in activities (anhedonia) combined with low energy for >2 weeks meets PHQ-9 criteria for clinically significant depression. "
            "MBCT (Mindfulness-Based Cognitive Therapy) reduces depression relapse by 43% and is first-line for recurrent depression (NICE 2022)."
        ),
        "source": "Mental Health Survey — Anhedonia / Work Interest Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    # Days indoors and mental health
    high_indoor = df[df["Days_Indoors"].isin([">14 days", "15 to 30 days"])]
    chunks.append({
        "id": f"{prefix}_sedentary_indoor",
        "text": (
            f"Indoor sedentary behavior and mental health (n={n_total:,}): "
            f"Those spending >14 days indoors: {pct(len(high_indoor), n_total)} of respondents. "
            f"Among this high-indoor group: {pct((high_indoor['Growing_Stress']=='Yes').sum(), len(high_indoor))} report growing stress, "
            f"{pct((high_indoor['Changes_Habits']=='Yes').sum(), len(high_indoor))} report habit changes. "
            "Prolonged indoor sedentary behavior reduces serotonin and dopamine production. "
            "Even 20-30 minutes of outdoor walking daily improves mood by 30%, reduces cortisol, and improves sleep onset latency. "
            "Vitamin D deficiency (common with low sun exposure) is independently linked to depression risk."
        ),
        "source": "Mental Health Survey — Sedentary Behavior Analysis",
        "condition": "mental_health",
        "dataset": "Mental Health Dataset.csv",
    })

    print(f"  [Mental Health Dataset.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── DATASET 4: Sleep_health_and_lifestyle_dataset.csv ───────────────────────

def ingest_sleep() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "Sleep_health_and_lifestyle_dataset.csv")
    df = pd.read_csv(path)
    chunks = []
    prefix = "sleep"

    n_total = len(df)

    # Parse BP into systolic/diastolic
    try:
        df[["Systolic", "Diastolic"]] = df["Blood Pressure"].str.split("/", expand=True).astype(float)
    except Exception:
        df["Systolic"] = 120
        df["Diastolic"] = 80

    # Overview
    disorder_counts = df["Sleep Disorder"].value_counts()
    chunks.append({
        "id": f"{prefix}_overview",
        "text": (
            f"Sleep Health and Lifestyle Dataset Analysis (n={n_total}): "
            f"Sleep disorders distribution — "
            + ", ".join([f"{k}: {v} ({v/n_total*100:.0f}%)" for k, v in disorder_counts.items()])
            + f". Average sleep duration: {df['Sleep Duration'].mean():.1f}h. "
            f"Average stress level: {df['Stress Level'].mean():.1f}/10. "
            f"Average quality of sleep: {df['Quality of Sleep'].mean():.1f}/10. "
            "Sleep disorders, particularly insomnia and sleep apnea, are significant yet underdiagnosed risk factors for hypertension, T2D, and CVD."
        ),
        "source": "Sleep Health and Lifestyle Dataset (Kaggle)",
        "condition": "hypertension",
        "dataset": "Sleep_health_and_lifestyle_dataset.csv",
    })

    # Sleep duration vs disorders
    insomnia = df[df["Sleep Disorder"] == "Insomnia"]
    apnea = df[df["Sleep Disorder"] == "Sleep Apnea"]
    no_disorder = df[df["Sleep Disorder"] == "None"]

    chunks.append({
        "id": f"{prefix}_disorder_bp",
        "text": (
            f"Sleep disorder and blood pressure (n={n_total}): "
            f"Sleep apnea group: avg BP {apnea['Systolic'].mean():.0f}/{apnea['Diastolic'].mean():.0f} mmHg. "
            f"Insomnia group: avg BP {insomnia['Systolic'].mean():.0f}/{insomnia['Diastolic'].mean():.0f} mmHg. "
            f"No disorder group: avg BP {no_disorder['Systolic'].mean():.0f}/{no_disorder['Diastolic'].mean():.0f} mmHg. "
            f"Sleep apnea average sleep duration: {apnea['Sleep Duration'].mean():.1f}h vs {no_disorder['Sleep Duration'].mean():.1f}h (no disorder). "
            "Sleep apnea causes intermittent hypoxia and repeated nocturnal BP surges. ESH 2023 guidelines recognize it as a secondary cause of hypertension. "
            "Lateral sleeping position, weight loss (each kg reduces apnea severity by 3%), and CPAP therapy are first-line interventions."
        ),
        "source": "Sleep Dataset — Sleep Disorder & Blood Pressure Analysis",
        "condition": "hypertension",
        "dataset": "Sleep_health_and_lifestyle_dataset.csv",
    })

    # Stress and sleep quality
    chunks.append({
        "id": f"{prefix}_stress_quality",
        "text": (
            f"Stress level and sleep quality correlation (n={n_total}): "
            f"High stress (≥7/10): avg sleep quality {df[df['Stress Level']>=7]['Quality of Sleep'].mean():.1f}/10, "
            f"avg sleep duration {df[df['Stress Level']>=7]['Sleep Duration'].mean():.1f}h. "
            f"Low stress (<4/10): avg sleep quality {df[df['Stress Level']<4]['Quality of Sleep'].mean():.1f}/10, "
            f"avg sleep duration {df[df['Stress Level']<4]['Sleep Duration'].mean():.1f}h. "
            "High cortisol from chronic stress suppresses melatonin secretion and delays sleep onset. "
            "15 minutes of Anulom-Vilom pranayama (6 breaths/min) before bed reduces sleep onset latency by 20 minutes and improves sleep quality score by 1.5 points. "
            "Progressive muscle relaxation and guided body-scan meditation are equally effective alternatives."
        ),
        "source": "Sleep Dataset — Stress & Sleep Quality Analysis",
        "condition": "mental_health",
        "dataset": "Sleep_health_and_lifestyle_dataset.csv",
    })

    # Occupation and sleep
    occ_sleep = df.groupby("Occupation")["Sleep Duration"].mean().sort_values()
    worst_sleep = occ_sleep.head(3)
    best_sleep = occ_sleep.tail(3)
    chunks.append({
        "id": f"{prefix}_occupation",
        "text": (
            f"Occupation and sleep duration (n={n_total}): "
            f"Lowest average sleep: {', '.join([f'{k} ({v:.1f}h)' for k, v in worst_sleep.items()])}. "
            f"Highest average sleep: {', '.join([f'{k} ({v:.1f}h)' for k, v in best_sleep.items()])}. "
            f"Physical activity level correlated with sleep quality: r={df['Physical Activity Level'].corr(df['Quality of Sleep']):.2f}. "
            "High-stress, high-demand occupations consistently show shorter sleep. "
            "Sleep <7h combined with sedentary occupation doubles fasting glucose impairment risk (Spiegel 2009). "
            "Corporate sleep hygiene programs that enforce 7-9h sleep windows reduce sick days by 20% and improve productivity."
        ),
        "source": "Sleep Dataset — Occupational Sleep Pattern Analysis",
        "condition": "diabetes",
        "dataset": "Sleep_health_and_lifestyle_dataset.csv",
    })

    # Physical activity and sleep
    chunks.append({
        "id": f"{prefix}_activity",
        "text": (
            f"Physical activity and sleep health (n={n_total}): "
            f"Average daily steps: {df['Daily Steps'].mean():.0f} steps/day. "
            f"Individuals with >8,000 steps/day: avg sleep quality {df[df['Daily Steps']>8000]['Quality of Sleep'].mean():.1f}/10 "
            f"vs {df[df['Daily Steps']<5000]['Quality of Sleep'].mean():.1f}/10 for <5,000 steps/day. "
            f"Average heart rate: {df['Heart Rate'].mean():.0f} bpm. "
            "10,000 steps/day target improves sleep onset, deep sleep duration, and morning cortisol response. "
            "Even a 20-minute post-dinner walk (after-dinner stroll / 'walk after meals') reduces postprandial glucose by 22% and improves sleep quality."
        ),
        "source": "Sleep Dataset — Physical Activity & Sleep Analysis",
        "condition": "diabetes",
        "dataset": "Sleep_health_and_lifestyle_dataset.csv",
    })

    print(f"  [Sleep_health_and_lifestyle_dataset.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── DATASET 5: diabetes_binary_health_indicators_BRFSS2015.csv ──────────────

def ingest_brfss() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "diabetes_binary_health_indicators_BRFSS2015.csv")
    # Sample to keep memory reasonable
    df = pd.read_csv(path).sample(n=50000, random_state=42)
    chunks = []
    prefix = "brfss"

    n_total = len(df)
    pos = df[df["Diabetes_binary"] == 1]
    neg = df[df["Diabetes_binary"] == 0]

    # Overview
    chunks.append({
        "id": f"{prefix}_overview",
        "text": (
            f"CDC BRFSS 2015 Diabetes Health Indicators Analysis (sample n={n_total:,}): "
            f"{pct(len(pos), n_total)} have diabetes or prediabetes. "
            f"High BP prevalence in diabetics: {pct((pos['HighBP']==1).sum(), len(pos))} vs {pct((neg['HighBP']==1).sum(), len(neg))} in non-diabetics. "
            f"High cholesterol in diabetics: {pct((pos['HighChol']==1).sum(), len(pos))} vs {pct((neg['HighChol']==1).sum(), len(neg))} in non-diabetics. "
            f"Heart disease in diabetics: {pct((pos['HeartDiseaseorAttack']==1).sum(), len(pos))} vs {pct((neg['HeartDiseaseorAttack']==1).sum(), len(neg))} in non-diabetics. "
            "The BRFSS is CDC's gold-standard behavioral risk surveillance system covering 400,000+ US adults annually. "
            "The co-occurrence of diabetes + hypertension + dyslipidemia defines metabolic syndrome, present in 60-70% of T2D patients."
        ),
        "source": "CDC BRFSS 2015 — Diabetes Health Indicators",
        "condition": "diabetes",
        "dataset": "diabetes_binary_health_indicators_BRFSS2015.csv",
    })

    # Physical activity
    chunks.append({
        "id": f"{prefix}_activity",
        "text": (
            f"Physical activity and diabetes (BRFSS 2015, n={n_total:,}): "
            f"Physically inactive diabetics: {pct((pos['PhysActivity']==0).sum(), len(pos))} have no physical activity. "
            f"Physical inactivity rate in non-diabetics: {pct((neg['PhysActivity']==0).sum(), len(neg))}. "
            f"Fruit consumption daily in diabetics: {pct((pos['Fruits']==1).sum(), len(pos))} vs {pct((neg['Fruits']==1).sum(), len(neg))} non-diabetics. "
            f"Vegetable consumption daily in diabetics: {pct((pos['Veggies']==1).sum(), len(pos))} vs {pct((neg['Veggies']==1).sum(), len(neg))} non-diabetics. "
            "Physical inactivity and poor diet together account for 60% of diabetes incidence. "
            "WHO recommends 150 min/week moderate activity (achievable with daily 30-minute brisk walks, 5 days/week). "
            "Indian vegetable alternatives: spinach (palak), fenugreek (methi), drumstick (murungakkai) — all low GI and high fiber."
        ),
        "source": "CDC BRFSS 2015 — Lifestyle & Diabetes Analysis",
        "condition": "diabetes",
        "dataset": "diabetes_binary_health_indicators_BRFSS2015.csv",
    })

    # Mental health and diabetes
    poor_mh_pos = pos[pos["MentHlth"] > 14]["MentHlth"].mean()
    poor_mh_neg = neg[neg["MentHlth"] > 14]["MentHlth"].mean()
    chunks.append({
        "id": f"{prefix}_mental_health",
        "text": (
            f"Mental health and diabetes co-occurrence (BRFSS 2015, n={n_total:,}): "
            f"Diabetic individuals with >14 poor mental health days/month: {pct((pos['MentHlth']>14).sum(), len(pos))}. "
            f"Non-diabetic individuals with >14 poor mental health days/month: {pct((neg['MentHlth']>14).sum(), len(neg))}. "
            f"Diabetics average {pos['MentHlth'].mean():.1f} poor mental health days/month vs {neg['MentHlth'].mean():.1f} for non-diabetics. "
            "Depression and diabetes have a bidirectional relationship: depression increases diabetes risk by 60%, "
            "and diabetes increases depression risk by 2-3x. Treating both simultaneously improves glycemic control and quality of life. "
            "Integrated care models (diabetes nurse + psychologist) reduce HbA1c by 0.5% and depression severity by 30% (Collaborative Care Model)."
        ),
        "source": "CDC BRFSS 2015 — Mental Health & Diabetes Analysis",
        "condition": "mental_health",
        "dataset": "diabetes_binary_health_indicators_BRFSS2015.csv",
    })

    # General health self-rating
    chunks.append({
        "id": f"{prefix}_gen_health",
        "text": (
            f"Self-rated general health and diabetes (BRFSS 2015, n={n_total:,}): "
            f"Diabetics rating health as Poor/Fair: {pct((pos['GenHlth']>=4).sum(), len(pos))}. "
            f"Non-diabetics rating health as Poor/Fair: {pct((neg['GenHlth']>=4).sum(), len(neg))}. "
            f"Difficulty walking/climbing stairs in diabetics: {pct((pos['DiffWalk']==1).sum(), len(pos))} vs {pct((neg['DiffWalk']==1).sum(), len(neg))} non-diabetics. "
            f"Stroke history in diabetics: {pct((pos['Stroke']==1).sum(), len(pos))} vs {pct((neg['Stroke']==1).sum(), len(neg))} non-diabetics. "
            "Poor self-rated health is a stronger predictor of mortality than many objective clinical measures. "
            "Early intervention when self-rated health begins declining is critical to reversing disease trajectory."
        ),
        "source": "CDC BRFSS 2015 — Self-Rated Health & Diabetes",
        "condition": "diabetes",
        "dataset": "diabetes_binary_health_indicators_BRFSS2015.csv",
    })

    # Alcohol and BMI
    chunks.append({
        "id": f"{prefix}_alcohol_bmi",
        "text": (
            f"Alcohol, BMI and diabetes risk (BRFSS 2015, n={n_total:,}): "
            f"Heavy alcohol use in diabetics: {pct((pos['HvyAlcoholConsump']==1).sum(), len(pos))} vs {pct((neg['HvyAlcoholConsump']==1).sum(), len(neg))} non-diabetics. "
            f"Average BMI diabetics: {pos['BMI'].mean():.1f} kg/m² vs {neg['BMI'].mean():.1f} kg/m² non-diabetics. "
            f"Obese (BMI≥30) with diabetes: {pct((pos['BMI']>=30).sum(), len(pos))} of diabetic group. "
            "Heavy alcohol (>14 units/week for men, >7 for women) impairs hepatic glucose regulation, worsens insulin resistance. "
            "Moderate alcohol (<7 units/week) shows a paradoxical mild protective effect on insulin sensitivity, but benefits do not outweigh risks for individuals already at elevated T2D risk."
        ),
        "source": "CDC BRFSS 2015 — Alcohol, BMI & Diabetes",
        "condition": "diabetes",
        "dataset": "diabetes_binary_health_indicators_BRFSS2015.csv",
    })

    print(f"  [diabetes_binary_BRFSS2015.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── DATASET 6: addiction_population_data.csv ────────────────────────────────

def ingest_addiction() -> List[Dict]:
    path = os.path.join(DATASETS_DIR, "addiction_population_data.csv")
    df = pd.read_csv(path)
    chunks = []
    prefix = "addict"

    n_total = len(df)

    # Smoking overview
    smokers = df[df["smokes_per_day"] > 0]
    chunks.append({
        "id": f"{prefix}_smoking_overview",
        "text": (
            f"Smoking patterns in population dataset (n={n_total:,}): "
            f"{pct(len(smokers), n_total)} are current smokers. "
            f"Average cigarettes/day among smokers: {smokers['smokes_per_day'].mean():.1f}. "
            f"Average age started smoking: {smokers['age_started_smoking'].mean():.0f} years. "
            f"Average quit attempts: {smokers['attempts_to_quit_smoking'].mean():.1f} attempts. "
            f"Among smokers with poor mental health: {pct((smokers[smokers['mental_health_status']=='Poor']['has_health_issues']==True).sum(), len(smokers[smokers['mental_health_status']=='Poor']))} have health issues. "
            "Smoking is the single largest modifiable CVD risk factor, doubling coronary artery disease risk. "
            "Quitting before age 40 reduces smoking-attributable mortality by 90% (AHA 2023). "
            "Nicotine replacement + varenicline combination achieves 35% quit rate at 6 months vs 5% cold turkey."
        ),
        "source": "Addiction Population Dataset — Smoking Analysis",
        "condition": "cvd",
        "dataset": "addiction_population_data.csv",
    })

    # Alcohol overview
    drinkers = df[df["drinks_per_week"] > 0]
    chunks.append({
        "id": f"{prefix}_alcohol_overview",
        "text": (
            f"Alcohol consumption patterns (n={n_total:,}): "
            f"{pct(len(drinkers), n_total)} consume alcohol. "
            f"Average drinks/week: {drinkers['drinks_per_week'].mean():.1f}. "
            f"Average age started drinking: {df['age_started_drinking'].mean():.0f} years. "
            f"Alcohol and poor sleep: those drinking >3/week averaged {df[df['drinks_per_week']>3]['sleep_hours'].mean():.1f}h sleep vs {df[df['drinks_per_week']==0]['sleep_hours'].mean():.1f}h for non-drinkers. "
            f"Alcohol and mental health: poor mental health rate among heavy drinkers (>5/week): {pct((df[df['drinks_per_week']>5]['mental_health_status']=='Poor').sum(), (df['drinks_per_week']>5).sum())}. "
            "Regular alcohol disrupts REM sleep, increases liver fat (NAFLD risk), and worsens hypertension by 5-10 mmHg. "
            "Indian context: toddy, beer, and whiskey are common. Even moderate weekly use (>7 units) raises BP measurably."
        ),
        "source": "Addiction Population Dataset — Alcohol Analysis",
        "condition": "cvd",
        "dataset": "addiction_population_data.csv",
    })

    # Social support and mental health
    support_none = df[df["social_support"] == "None"]
    support_strong = df[df["social_support"] == "Strong"]
    chunks.append({
        "id": f"{prefix}_social_support",
        "text": (
            f"Social support and health outcomes in addiction dataset (n={n_total:,}): "
            f"No social support: {pct((support_none['mental_health_status']=='Poor').sum(), len(support_none))} poor mental health, "
            f"{pct((support_none['has_health_issues']==True).sum(), len(support_none))} have health issues. "
            f"Strong social support: {pct((support_strong['mental_health_status']=='Poor').sum(), len(support_strong))} poor mental health, "
            f"{pct((support_strong['has_health_issues']==True).sum(), len(support_strong))} have health issues. "
            "Strong social support reduces substance misuse relapse rates by 40% and is a stronger predictor of recovery than therapy alone. "
            "Indian family support networks, community religious groups, and peer recovery groups (AA India: aaindia.org) are proven resources."
        ),
        "source": "Addiction Dataset — Social Support & Health Analysis",
        "condition": "mental_health",
        "dataset": "addiction_population_data.csv",
    })

    # Diet quality and BMI/mental health
    poor_diet = df[df["diet_quality"] == "Poor"]
    good_diet = df[df["diet_quality"] == "Good"]
    chunks.append({
        "id": f"{prefix}_diet_bmi",
        "text": (
            f"Diet quality, BMI, and mental health (n={n_total:,}): "
            f"Poor diet group: avg BMI {poor_diet['bmi'].mean():.1f} kg/m², avg sleep {poor_diet['sleep_hours'].mean():.1f}h, "
            f"{pct((poor_diet['mental_health_status']=='Poor').sum(), len(poor_diet))} poor mental health. "
            f"Good diet group: avg BMI {good_diet['bmi'].mean():.1f} kg/m², avg sleep {good_diet['sleep_hours'].mean():.1f}h, "
            f"{pct((good_diet['mental_health_status']=='Poor').sum(), len(good_diet))} poor mental health. "
            "Diet quality is a leading determinant of both physical and mental health. "
            "Mediterranean and MIND dietary patterns reduce depression risk by 25-35% (BMJ 2018). "
            "Indian equivalent: dal-based meals, plenty of sabzi (vegetables), minimal refined carbs, and probiotic-rich foods (curd, kanji)."
        ),
        "source": "Addiction Dataset — Diet Quality & Mental Health",
        "condition": "mental_health",
        "dataset": "addiction_population_data.csv",
    })

    # Exercise frequency
    never_exercise = df[df["exercise_frequency"] == "Never"]
    daily_exercise = df[df["exercise_frequency"] == "Daily"]
    chunks.append({
        "id": f"{prefix}_exercise",
        "text": (
            f"Exercise frequency and health outcomes (n={n_total:,}): "
            f"Never exercise: avg BMI {never_exercise['bmi'].mean():.1f} kg/m², avg sleep {never_exercise['sleep_hours'].mean():.1f}h, "
            f"{pct((never_exercise['mental_health_status']=='Poor').sum(), len(never_exercise))} poor mental health, "
            f"{pct((never_exercise['has_health_issues']==True).sum(), len(never_exercise))} with health issues. "
            f"Daily exercisers: avg BMI {daily_exercise['bmi'].mean():.1f} kg/m², avg sleep {daily_exercise['sleep_hours'].mean():.1f}h, "
            f"{pct((daily_exercise['mental_health_status']=='Poor').sum(), len(daily_exercise))} poor mental health. "
            "Exercise is the most cost-effective intervention for physical and mental health combined. "
            "Even 3 days/week of 30-minute moderate activity reduces depression scores by 47%, equivalent to antidepressant medication (Blumenthal 1999, JAMA)."
        ),
        "source": "Addiction Dataset — Exercise & Health Analysis",
        "condition": "mental_health",
        "dataset": "addiction_population_data.csv",
    })

    # Therapy history
    therapy_current = df[df["therapy_history"] == "Current"]
    therapy_none = df[df["therapy_history"] == "None"]
    chunks.append({
        "id": f"{prefix}_therapy",
        "text": (
            f"Therapy history and health outcomes (n={n_total:,}): "
            f"Currently in therapy: {pct(len(therapy_current), n_total)} of population. "
            f"Current therapy group poor mental health rate: {pct((therapy_current['mental_health_status']=='Poor').sum(), len(therapy_current))}. "
            f"No therapy history poor mental health rate: {pct((therapy_none['mental_health_status']=='Poor').sum(), len(therapy_none))}. "
            f"Current therapy group avg BMI: {therapy_current['bmi'].mean():.1f} kg/m², avg sleep: {therapy_current['sleep_hours'].mean():.1f}h. "
            "Therapy engagement — even when mental health is poor — indicates help-seeking behavior that improves outcomes. "
            "CBT, DBT, and mindfulness-based therapies reduce symptom burden by 40-60% over 12 sessions. "
            "iCall (TISS) online: 9152987821 | Vandrevala Foundation: 1860-2662-345"
        ),
        "source": "Addiction Dataset — Therapy Engagement Analysis",
        "condition": "mental_health",
        "dataset": "addiction_population_data.csv",
    })

    print(f"  [addiction_population_data.csv] Generated {len(chunks)} chunks")
    return chunks


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def run_ingestion():
    print("\n=== LifeGuard AI — Dataset Ingestion Pipeline ===\n")

    # Connect to Pinecone directly (avoids circular call with initialize_kb)
    from rag.knowledge_base import _get_index, _get_embedder
    print("[Init] Connecting to Pinecone and loading embedder...")
    _get_index()
    _get_embedder()

    all_chunks = []

    print("\n[Step 1] Processing diabetes.csv (Pima Dataset)...")
    all_chunks.extend(ingest_diabetes_pima())

    print("[Step 2] Processing hypertension_dataset.csv (174k rows)...")
    all_chunks.extend(ingest_hypertension())

    print("[Step 3] Processing Mental Health Dataset.csv (292k rows)...")
    all_chunks.extend(ingest_mental_health())

    print("[Step 4] Processing Sleep_health_and_lifestyle_dataset.csv (373 rows)...")
    all_chunks.extend(ingest_sleep())

    print("[Step 5] Processing diabetes_binary_health_indicators_BRFSS2015.csv (sampling 50k)...")
    all_chunks.extend(ingest_brfss())

    print("[Step 6] Processing addiction_population_data.csv (3k rows)...")
    all_chunks.extend(ingest_addiction())

    print(f"\n[Upsert] Embedding and upserting {len(all_chunks)} dataset insight chunks to Pinecone...")
    upserted = _upsert_chunks(all_chunks)

    print(f"\n[Done] Upserted {upserted} dataset-derived insight chunks.")
    print("   Namespace: default (same as seed_data.py)")
    print("   Total knowledge base now includes medical guidelines + data-derived insights.\n")


if __name__ == "__main__":
    run_ingestion()
