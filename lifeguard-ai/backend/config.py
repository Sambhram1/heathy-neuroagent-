from dotenv import load_dotenv
import os


def _getenv_trimmed(name: str, default=None):
	value = os.getenv(name, default)
	if isinstance(value, str):
		cleaned = value.strip().lstrip("\ufeff")
		if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in ('"', "'"):
			cleaned = cleaned[1:-1].strip()
		return cleaned
	return value

# Resolve .env relative to this file (backend/../.env = lifeguard-ai/.env)
_here = os.path.dirname(os.path.abspath(__file__))
_env_path = os.path.join(_here, "..", ".env")
load_dotenv(dotenv_path=_env_path)

# NVIDIA NIM API (OpenAI-compatible endpoint for Kimi K2)
NVIDIA_API_KEY = _getenv_trimmed("NVIDIA_API_KEY")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
KIMI_MODEL = "moonshotai/kimi-k2-instruct"

# Pinecone
PINECONE_API_KEY = _getenv_trimmed("PINECONE_API_KEY")
PINECONE_INDEX_NAME = _getenv_trimmed("PINECONE_INDEX_NAME", "lifeguard-medical")
