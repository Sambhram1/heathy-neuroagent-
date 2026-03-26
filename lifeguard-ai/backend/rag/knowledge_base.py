import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME
from rag.seed_data import MEDICAL_KNOWLEDGE

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension

_pc = None
_index = None
_embedder = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        print("[KB] Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=PINECONE_API_KEY)

        existing = [idx.name for idx in _pc.list_indexes()]
        if PINECONE_INDEX_NAME not in existing:
            print(f"[KB] Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
            _pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=EMBEDDING_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            # Wait for index to be ready
            import time
            while not _pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
                time.sleep(1)
            print(f"[KB] Index '{PINECONE_INDEX_NAME}' ready.")

        _index = _pc.Index(PINECONE_INDEX_NAME)
    return _index


def initialize_kb() -> int:
    index = _get_index()
    stats = index.describe_index_stats()
    total = stats.get("total_vector_count", 0)

    # Seed medical guidelines if index is brand new
    if total == 0:
        print(f"[KB] Seeding Pinecone with {len(MEDICAL_KNOWLEDGE)} medical knowledge chunks...")
        embedder = _get_embedder()

        texts = [item["text"] for item in MEDICAL_KNOWLEDGE]
        vectors = embedder.encode(texts, show_progress_bar=True).tolist()

        upsert_data = [
            {
                "id": f"doc_{i}",
                "values": vectors[i],
                "metadata": {
                    "text": MEDICAL_KNOWLEDGE[i]["text"],
                    "source": MEDICAL_KNOWLEDGE[i]["source"],
                    "condition": MEDICAL_KNOWLEDGE[i]["condition"],
                    "dataset": "seed_data",
                },
            }
            for i in range(len(MEDICAL_KNOWLEDGE))
        ]

        batch_size = 100
        for start in range(0, len(upsert_data), batch_size):
            index.upsert(vectors=upsert_data[start : start + batch_size])

        print(f"[KB] Seeded {len(MEDICAL_KNOWLEDGE)} guideline documents.")

    else:
        print(f"[KB] Pinecone index already has {total} vectors. Skipping seed.")

    return get_document_count()


def get_index():
    return _get_index()


def get_document_count() -> int:
    try:
        index = _get_index()
        stats = index.describe_index_stats()
        return stats.get("total_vector_count", 0)
    except Exception:
        return 0
