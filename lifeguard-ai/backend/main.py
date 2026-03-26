import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from models.schemas import ChatRequest, ChatResponse, RiskScores, MentalChatRequest, MentalChatResponse, AssessRequest, AssessResponse
from agents.orchestrator import run_agent
from agents.mental_chat import run_mental_chat
from rag.knowledge_base import initialize_kb, get_document_count

# In-memory session store: session_id -> {messages: [], risk_scores, amplifiers, evidence, plan_ready, plan}
sessions: dict = {}
_kb_initialized = False


def _running_on_vercel() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def ensure_kb_initialized() -> int:
    global _kb_initialized
    if _kb_initialized:
        return get_document_count()

    try:
        print("[Startup] Initializing Pinecone knowledge base...")
        count = initialize_kb()
        if count <= len([]):  # only run dataset ingestion when freshly seeded
            try:
                from rag.ingest_datasets import run_ingestion
                run_ingestion()
            except Exception as e:
                print(f"[Startup] Dataset ingestion skipped: {e}")

        _kb_initialized = True
        count = get_document_count()
        print(f"[Startup] Knowledge base ready with {count} vectors.")
        return count
    except Exception as e:
        print(f"[Startup] Knowledge base initialization failed: {e}")
        return 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    if _running_on_vercel():
        # Serverless cold starts can be strict; initialize lazily on first API hit.
        print("[Startup] Vercel runtime detected. Deferring KB initialization.")
    else:
        ensure_kb_initialized()
    yield
    print("[Shutdown] LifeGuard AI shutting down.")


app = FastAPI(
    title="LifeGuard AI",
    description="Early Lifestyle Disease Risk Prediction with Mental Health Integration",
    version="1.0.0",
    lifespan=lifespan,
)


def _clean_origin(value: str) -> str:
    if not value:
        return ""
    return value.strip().strip('"').rstrip("/")


vercel_url = _clean_origin(os.getenv("VERCEL_URL", ""))
frontend_url = _clean_origin(os.getenv("FRONTEND_URL", ""))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *(
            [f"https://{vercel_url}"]
            if vercel_url
            else []
        ),
        *(
            [frontend_url]
            if frontend_url
            else []
        ),
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
)


@app.get("/api/health")
async def health_check():
    try:
        if not _kb_initialized:
            ensure_kb_initialized()
        kb_count = get_document_count()
    except Exception:
        kb_count = 0
    return {"status": "ok", "kb_documents": kb_count}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not _kb_initialized:
        ensure_kb_initialized()

    session_id = request.session_id

    # Initialize session if new
    if session_id not in sessions:
        sessions[session_id] = {
            "messages": [],
            "risk_scores": None,
            "amplifiers": [],
            "evidence": [],
            "plan_ready": False,
            "plan": None,
        }

    session = sessions[session_id]

    # Build message list for agent (include all history + new messages)
    all_messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        result = await run_agent(all_messages, session)
    except Exception as e:
        print(f"[Error] Agent failed: {e}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Persist updated session state
    sessions[session_id] = session

    # Build response
    risk_scores_out = None
    if result.get("risk_scores"):
        rs = result["risk_scores"]
        if isinstance(rs, RiskScores):
            risk_scores_out = rs
        elif isinstance(rs, dict):
            risk_scores_out = RiskScores(**rs)

    return ChatResponse(
        message=result["message"],
        risk_scores=risk_scores_out,
        plan_ready=result.get("plan_ready", False),
        amplifiers=result.get("amplifiers", []),
        evidence=result.get("evidence", []),
    )


@app.post("/api/assess", response_model=AssessResponse)
async def assess(req: AssessRequest):
    from agents.risk_scorer import calculate_risk_scores
    from agents.psychosomatic import calculate_amplification

    bmi = req.weight_kg / ((req.height_cm / 100) ** 2)

    risk_scores = calculate_risk_scores(
        age=req.age,
        sex=req.sex,
        bmi=round(bmi, 1),
        waist_cm=req.waist_cm,
        activity_level=req.activity_level,
        diet_quality=req.diet_quality,
        sleep_hours=req.sleep_hours,
        sleep_quality=req.sleep_quality,
        stress_level=req.stress_level,
        family_history=req.family_history,
        smoking=req.smoking,
        phq9_estimate=req.phq9_estimate,
        gad7_estimate=req.gad7_estimate,
        systolic_bp=req.systolic_bp,
        fasting_glucose=req.fasting_glucose,
    )

    amplifiers = calculate_amplification(
        stress_level=req.stress_level,
        sleep_hours=req.sleep_hours,
        phq9_score=req.phq9_estimate,
        gad7_score=req.gad7_estimate,
        diabetes_risk=risk_scores.diabetes_risk,
        hypertension_risk=risk_scores.hypertension_risk,
    )

    conditions = []
    if risk_scores.diabetes_risk >= 40: conditions.append("metabolic risk")
    if risk_scores.hypertension_risk >= 40: conditions.append("vascular risk")
    if risk_scores.cvd_risk >= 40: conditions.append("cardiovascular risk")
    if risk_scores.mental_health_index >= 40: conditions.append("psychosomatic load")
    summary = f"Profile: {req.age}yo {req.sex}, BMI {round(bmi,1)}. Elevated: {', '.join(conditions) if conditions else 'none detected'}."

    return AssessResponse(risk_scores=risk_scores, amplifiers=amplifiers, profile_summary=summary)


@app.post("/api/mental-chat", response_model=MentalChatResponse)
async def mental_chat(request: MentalChatRequest):
    if not _kb_initialized:
        ensure_kb_initialized()

    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    try:
        result = await run_mental_chat(messages)
    except Exception as e:
        print(f"[Error] Mental chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Mental chat error: {str(e)}")
    return MentalChatResponse(
        message=result["message"],
        crisis_detected=result.get("crisis_detected", False),
    )


@app.post("/api/reset")
async def reset_session(body: dict):
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    if session_id in sessions:
        del sessions[session_id]
    return {"success": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
