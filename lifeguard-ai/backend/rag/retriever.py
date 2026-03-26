import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Optional
from rag.knowledge_base import get_index, _get_embedder


def search(query: str, n_results: int = 4, conditions: Optional[List[str]] = None) -> List[dict]:
    embedder = _get_embedder()
    index = get_index()

    query_vector = embedder.encode([query])[0].tolist()

    # Build metadata filter for Pinecone
    pinecone_filter = None
    if conditions and len(conditions) == 1:
        pinecone_filter = {"condition": {"$eq": conditions[0]}}
    elif conditions and len(conditions) > 1:
        pinecone_filter = {"condition": {"$in": conditions}}

    query_kwargs = {
        "vector": query_vector,
        "top_k": n_results,
        "include_metadata": True,
    }
    if pinecone_filter:
        query_kwargs["filter"] = pinecone_filter

    response = index.query(**query_kwargs)

    results = []
    for match in response.get("matches", []):
        meta = match.get("metadata", {})
        relevance_score = round(match.get("score", 0) * 100, 1)
        results.append(
            {
                "text": meta.get("text", ""),
                "source": meta.get("source", "Unknown"),
                "condition": meta.get("condition", "general"),
                "relevance_score": relevance_score,
            }
        )

    return results
