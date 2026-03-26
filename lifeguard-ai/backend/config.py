from dotenv import load_dotenv
import os

# Resolve .env relative to this file (backend/../.env = lifeguard-ai/.env)
_here = os.path.dirname(os.path.abspath(__file__))
_env_path = os.path.join(_here, "..", ".env")
load_dotenv(dotenv_path=_env_path)

# NVIDIA NIM API (OpenAI-compatible endpoint for Kimi K2)
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
KIMI_MODEL = "moonshotai/kimi-k2-instruct"

# Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "lifeguard-medical")
