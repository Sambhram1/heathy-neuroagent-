import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from models.schemas import ChatRequest, ChatResponse, RiskScores
from agents.orchestrator import run_agent
from rag.knowledge_base import initialize_kb, get_document_count

# In-memory session store: session_id -> {messages: [], risk_scores, amplifiers, evidence, plan_ready, plan}
sessions: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Initializing Pinecone knowledge base...")
    count = initialize_kb()
    if count <= len([]):  # only run dataset ingestion when freshly seeded
        try:
            from rag.ingest_datasets import run_ingestion
            run_ingestion()
        except Exception as e:
            print(f"[Startup] Dataset ingestion skipped: {e}")
    count = get_document_count()
    print(f"[Startup] Knowledge base ready with {count} vectors.")
    yield
    print("[Shutdown] LifeGuard AI shutting down.")


app = FastAPI(
    title="LifeGuard AI",
    description="Early Lifestyle Disease Risk Prediction with Mental Health Integration",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    try:
        kb_count = get_document_count()
    except Exception:
        kb_count = 0
    return {"status": "ok", "kb_documents": kb_count}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
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


@app.post("/api/reset")
async def reset_session(body: dict):
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    if session_id in sessions:
        del sessions[session_id]
    return {"success": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
