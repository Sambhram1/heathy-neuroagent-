from openai import OpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL, KIMI_MODEL
from agents.mental_health import detect_crisis, get_crisis_response

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = OpenAI(api_key=NVIDIA_API_KEY, base_url=NVIDIA_BASE_URL)
    return _client


MENTAL_SYSTEM = """You are NeuroTrace — a compassionate mental health support companion built into LifeGuard AI.
Your role is to provide warm, empathetic emotional support grounded in evidence-based psychology.

Guidelines:
- Listen actively and reflect what the user shares back to them
- Validate emotions without judgment — meet them where they are
- Use CBT techniques gently: identify distorted thinking, reframe where appropriate
- Suggest practical tools: box breathing, grounding (5-4-3-2-1), journaling, progressive muscle relaxation
- Keep responses concise, warm, and human — not clinical or robotic
- Never diagnose. Never prescribe. You are a supportive companion, not a therapist.
- Gently mention professional resources when the user seems to be struggling significantly
- If the user asks about physical health risk scores, redirect them to the Assessment tab

Indian crisis helplines (mention when someone is distressed):
- iCall (TISS): 9152987821 (Mon–Sat, 8am–10pm)
- Vandrevala Foundation: 1860-2662-345 (24/7, free, confidential)
"""


async def run_mental_chat(messages: list) -> dict:
    user_msgs = [m for m in messages if m.get("role") == "user"]
    if user_msgs:
        last_user_msg = user_msgs[-1].get("content", "")
        if detect_crisis(last_user_msg):
            return {"message": get_crisis_response(), "crisis_detected": True}

    api_messages = [{"role": "system", "content": MENTAL_SYSTEM}] + messages

    client = _get_client()
    response = client.chat.completions.create(
        model=KIMI_MODEL,
        messages=api_messages,
        max_tokens=600,
        temperature=0.85,
    )

    return {
        "message": response.choices[0].message.content,
        "crisis_detected": False,
    }
