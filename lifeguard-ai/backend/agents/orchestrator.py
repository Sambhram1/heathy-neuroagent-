import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL, KIMI_MODEL
from agents.risk_scorer import calculate_risk_scores
from agents.psychosomatic import calculate_amplification
from agents.plan_generator import generate_prevention_plan
from agents.mental_health import detect_crisis, get_crisis_response
from rag.retriever import search as rag_search
from models.schemas import RiskScores

SYSTEM_PROMPT = """You are LifeGuard AI — an expert clinical-grade health risk analyst and empathetic wellness advisor. You assess risk for Type 2 Diabetes, Hypertension, Cardiovascular Disease, and mental health challenges using lifestyle data, then provide evidence-backed, personalized prevention plans.

IDENTITY: You are warm, clear, and empowering — never alarmist, never dismissive. You speak in plain language. You never diagnose. You always recommend consulting a physician for formal evaluation.

TOOLS: You have access to these tools — use them in this order:
1. calculate_risk_scores — call after collecting all profile data
2. retrieve_medical_evidence — call for each elevated risk area
3. calculate_psychosomatic_amplification — call after scoring to show mind-body links
4. generate_prevention_plan — call last, after evidence retrieval

WORKFLOW:
Phase 1 — INTAKE: Collect data conversationally in 3 groups. Don't dump all questions at once.
  Group A (biometrics): age, sex, height, weight, waist measurement
  Group B (lifestyle): activity level, diet quality, sleep hours & quality, stress level
  Group C (history): family history, smoking, alcohol, any BP or glucose readings

Phase 1B — MENTAL HEALTH: After physical data, gently ask:
  - "Over the last two weeks, how often have you felt low energy, little interest in things, or hopeless?" (PHQ-9 proxy)
  - "Do you find yourself worrying excessively or feeling on edge?" (GAD-7 proxy)
  - "Rate your stress level 1-10 and tell me the main source."
  - "How's your sleep — do you wake up feeling rested?"
  Internally estimate PHQ-9 (0-27) and GAD-7 (0-21) from responses.

Phase 2 — SCORING: Call calculate_risk_scores. Present results clearly with risk levels.

Phase 3 — EVIDENCE: Call retrieve_medical_evidence for elevated risks. Cite every major claim.

Phase 4 — AMPLIFICATION: Call calculate_psychosomatic_amplification. Explicitly explain mind-body links.

Phase 5 — PLAN: Call generate_prevention_plan. Output structured plan with:
  - Priority actions (next 30 days)
  - Nutrition (with Indian food alternatives)
  - Exercise prescription
  - Sleep & stress interventions
  - Mental wellness practices
  - When to see a doctor (specific thresholds)

SAFETY RULES:
- NEVER diagnose. Say "your profile suggests elevated risk" not "you have X"
- NEVER recommend specific medications
- If user shows crisis signals (hopelessness, self-harm mentions): immediately pause, show empathy, provide iCall: 9152987821 and Vandrevala: 1860-2662-345
- Always use India-specific food alternatives (methi not kale, dal not lentil soup)
- Frame mental health as part of overall performance and quality of life, not illness
- Remind the user this is preventive awareness, not clinical diagnosis"""

# OpenAI-compatible tool definitions (used by Kimi K2 via NVIDIA NIM)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_risk_scores",
            "description": "Calculate disease risk scores from user lifestyle profile. Call this once all biometric and lifestyle data has been collected.",
            "parameters": {
                "type": "object",
                "properties": {
                    "age": {"type": "integer", "description": "Age in years"},
                    "sex": {"type": "string", "enum": ["male", "female", "other"]},
                    "bmi": {"type": "number", "description": "Body Mass Index (weight_kg / height_m^2)"},
                    "waist_cm": {"type": "number", "description": "Waist circumference in cm"},
                    "activity_level": {"type": "string", "enum": ["sedentary", "light", "moderate", "active"]},
                    "diet_quality": {"type": "integer", "minimum": 1, "maximum": 10},
                    "sleep_hours": {"type": "number"},
                    "sleep_quality": {"type": "string", "enum": ["poor", "fair", "good"]},
                    "stress_level": {"type": "integer", "minimum": 1, "maximum": 10},
                    "family_history": {"type": "array", "items": {"type": "string"}},
                    "smoking": {"type": "boolean"},
                    "phq9_estimate": {"type": "integer", "minimum": 0, "maximum": 27},
                    "gad7_estimate": {"type": "integer", "minimum": 0, "maximum": 21},
                    "systolic_bp": {"type": "number"},
                    "fasting_glucose": {"type": "number"},
                },
                "required": ["age", "sex", "bmi", "activity_level", "stress_level", "sleep_hours"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "retrieve_medical_evidence",
            "description": "Search the Pinecone medical knowledge base for evidence-backed information on risk factors and interventions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The health topic or risk factor to search for"},
                    "conditions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Filter by condition: diabetes, hypertension, cvd, mental_health",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_psychosomatic_amplification",
            "description": "Calculate how mental health factors amplify physical disease risk. Show quantified mind-body connections.",
            "parameters": {
                "type": "object",
                "properties": {
                    "stress_level": {"type": "integer"},
                    "sleep_hours": {"type": "number"},
                    "phq9_score": {"type": "integer"},
                    "gad7_score": {"type": "integer"},
                    "diabetes_risk": {"type": "number"},
                    "hypertension_risk": {"type": "number"},
                    "cvd_risk": {"type": "number"},
                },
                "required": ["stress_level", "sleep_hours", "phq9_score", "gad7_score"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_prevention_plan",
            "description": "Generate a comprehensive personalized prevention plan based on risk scores and retrieved evidence.",
            "parameters": {
                "type": "object",
                "properties": {
                    "risk_scores": {"type": "object", "description": "The calculated risk scores dictionary"},
                    "top_risk_factors": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of top identified risk factors",
                    },
                    "retrieved_evidence": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Evidence text chunks retrieved from Pinecone",
                    },
                    "user_context": {"type": "string", "description": "Brief summary of user profile"},
                },
                "required": ["risk_scores", "top_risk_factors"],
            },
        },
    },
]


def _execute_tool(tool_name: str, tool_input: dict) -> dict:
    if tool_name == "calculate_risk_scores":
        scores = calculate_risk_scores(**tool_input)
        return {
            "diabetes_risk": scores.diabetes_risk,
            "hypertension_risk": scores.hypertension_risk,
            "cvd_risk": scores.cvd_risk,
            "mental_health_index": scores.mental_health_index,
            "overall_risk": scores.overall_risk,
        }

    elif tool_name == "retrieve_medical_evidence":
        query = tool_input.get("query", "")
        conditions = tool_input.get("conditions", None)
        try:
            results = rag_search(query, n_results=4, conditions=conditions)
        except Exception as e:
            print(f"[RAG] Retrieval failed: {e}")
            results = []
        return {"evidence": results}

    elif tool_name == "calculate_psychosomatic_amplification":
        amplifiers = calculate_amplification(
            stress_level=tool_input.get("stress_level", 5),
            sleep_hours=tool_input.get("sleep_hours", 7),
            phq9_score=tool_input.get("phq9_score", 0),
            gad7_score=tool_input.get("gad7_score", 0),
            diabetes_risk=tool_input.get("diabetes_risk"),
            hypertension_risk=tool_input.get("hypertension_risk"),
            cvd_risk=tool_input.get("cvd_risk"),
        )
        return {"amplifiers": amplifiers}

    elif tool_name == "generate_prevention_plan":
        plan = generate_prevention_plan(
            risk_scores=tool_input.get("risk_scores", {}),
            top_risk_factors=tool_input.get("top_risk_factors", []),
            retrieved_evidence=tool_input.get("retrieved_evidence", []),
            user_context=tool_input.get("user_context", ""),
        )
        return {"plan": plan}

    return {"error": f"Unknown tool: {tool_name}"}


async def run_agent(messages: list, session_data: dict) -> dict:
    client = OpenAI(
        api_key=NVIDIA_API_KEY,
        base_url=NVIDIA_BASE_URL,
    )

    # Crisis check on latest user message
    latest_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            latest_user_msg = msg.get("content", "")
            break

    if detect_crisis(latest_user_msg):
        return {
            "message": get_crisis_response(),
            "risk_scores": session_data.get("risk_scores"),
            "plan_ready": False,
            "amplifiers": [],
            "evidence": [],
        }

    # Build OpenAI-compatible message list
    oai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in messages:
        if m["role"] in ("user", "assistant"):
            oai_messages.append({"role": m["role"], "content": m["content"]})

    risk_scores = session_data.get("risk_scores")
    amplifiers = session_data.get("amplifiers", [])
    evidence_chunks = session_data.get("evidence", [])
    plan_ready = session_data.get("plan_ready", False)

    max_iterations = 6
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        response = client.chat.completions.create(
            model=KIMI_MODEL,
            messages=oai_messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=4096,
        )

        choice = response.choices[0]
        msg = choice.message

        # Append assistant turn (with any tool_calls)
        assistant_turn = {"role": "assistant", "content": msg.content or ""}
        if msg.tool_calls:
            assistant_turn["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in msg.tool_calls
            ]
        oai_messages.append(assistant_turn)

        # If no tool calls, we're done
        if not msg.tool_calls:
            return {
                "message": msg.content or "",
                "risk_scores": risk_scores,
                "plan_ready": plan_ready,
                "amplifiers": amplifiers,
                "evidence": evidence_chunks,
            }

        # Execute each tool call and append results
        for tc in msg.tool_calls:
            tool_name = tc.function.name
            try:
                tool_input = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                tool_input = {}

            result = _execute_tool(tool_name, tool_input)

            # Extract structured data into session
            if tool_name == "calculate_risk_scores":
                risk_scores = RiskScores(**result)
                session_data["risk_scores"] = risk_scores

            elif tool_name == "retrieve_medical_evidence":
                ev = result.get("evidence", [])
                evidence_chunks.extend(ev)
                session_data["evidence"] = evidence_chunks

            elif tool_name == "calculate_psychosomatic_amplification":
                amplifiers = result.get("amplifiers", [])
                session_data["amplifiers"] = amplifiers

            elif tool_name == "generate_prevention_plan":
                plan_ready = True
                session_data["plan_ready"] = True
                session_data["plan"] = result.get("plan", {})

            # Append tool result message (OpenAI format)
            oai_messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result),
            })

    # Fallback
    return {
        "message": "I've finished analyzing your health profile. Check your risk dashboard for scores and your prevention plan.",
        "risk_scores": risk_scores,
        "plan_ready": plan_ready,
        "amplifiers": amplifiers,
        "evidence": evidence_chunks,
    }
