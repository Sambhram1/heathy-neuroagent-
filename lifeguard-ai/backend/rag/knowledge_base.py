import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import hashlib
import math
import re

from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME
from rag.seed_data import MEDICAL_KNOWLEDGE

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension

_pc = None
_index = None


def _tokenize(text: str) -> list:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _hash_embed_text(text: str) -> list:
    vec = [0.0] * EMBEDDING_DIM
    tokens = _tokenize(text)
    if not tokens:
        return vec

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for i in range(0, len(digest), 2):
            idx = digest[i] % EMBEDDING_DIM
            sign = 1.0 if (digest[i + 1] % 2 == 0) else -1.0
            vec[idx] += sign

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed_texts(texts: list) -> list:
    return [_hash_embed_text(text) for text in texts]


def embed_query(text: str) -> list:
    return _hash_embed_text(text)


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
        texts = [item["text"] for item in MEDICAL_KNOWLEDGE]
        vectors = embed_texts(texts)

        upsert_data = [
            {
                "id": f"doc_{i}",
                "values": vectors[i],
                "metadata": {
                    "text": MEDICAL_KNOWLEDGE[i]["text"],
                    "source": MEDICAL_KNOWLEDGE[i]["source"],
                    "condition": MEDICAL_KNOWLEDGE[i]["condition"],
                    "dataset": "seed_data",
                    "embedding_model": "hash-v1",
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
