# LifeGuard AI — Early Disease Risk Prediction

An agentic AI system for predicting lifestyle disease risk (T2D, Hypertension, CVD) with integrated mental health screening. Built for an AI hackathon.

## Architecture

```
User Chat → Claude (claude-sonnet-4-20250514) with Tool Use
              ├── calculate_risk_scores     → South Asian BMI thresholds, Framingham-adapted CVD
              ├── retrieve_medical_evidence → ChromaDB RAG (35+ medical guidelines)
              ├── calculate_psychosomatic_amplification → Mind-body risk multipliers
              └── generate_prevention_plan  → India-specific evidence-backed plan
```

- **Agentic RAG pipeline** with 4 specialized tools called by Claude via tool use API
- **ChromaDB** vector store (all-MiniLM-L6-v2 embeddings) with 35+ medical knowledge chunks
- **PHQ-9/GAD-7** mental health screening integrated into risk scoring
- **Psychosomatic amplification** model: stress→diabetes, sleep→BP, depression→CVD links
- **India-specific thresholds**: ICMR South Asian BMI (23/25/30), INTERHEART 1.3x CVD multiplier
- **Crisis detection**: keyword-based, triggers immediate helpline response

## Setup

### Backend

```bash
cd lifeguard-ai/backend
pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env and add your ANTHROPIC_API_KEY
python main.py
# Runs on http://localhost:8000
# ChromaDB seeds automatically on first run (takes ~30s for embedding model download)
```

### Frontend

```bash
cd lifeguard-ai/frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Then open http://localhost:5173 in your browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Main agentic chat endpoint |
| POST | `/api/reset` | Reset session state |
| GET | `/api/health` | Health check + KB document count |

## Demo Flow

1. Open chat → answer ~10 conversational questions
2. Watch 4 animated SVG gauge charts fill live as Claude calls tools
3. Mind-body amplifier cards appear showing stress→diabetes, sleep→BP links
4. Cited prevention plan with Indian food alternatives populates automatically

## Safety

- Never diagnoses — uses "your profile suggests elevated risk"
- Crisis detection on every message → iCall (9152987821) + Vandrevala (1860-2662-345)
- Recommends physician consultation for all elevated risk areas
- All citations from peer-reviewed sources (Lancet, NEJM, JAMA, AHA)

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ · FastAPI · Uvicorn |
| LLM | Anthropic Claude (`claude-sonnet-4-20250514`) with tool use |
| Vector DB | ChromaDB (local persistent) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Frontend | React 18 · Vite · Tailwind CSS |
| Fonts | DM Mono (scores) · Inter (body) |
