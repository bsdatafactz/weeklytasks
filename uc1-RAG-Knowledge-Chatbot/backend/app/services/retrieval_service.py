from azure.search.documents.models import VectorizedQuery

from app.clients.azure_search_client import get_search_client
from app.config import get_settings
from app.services.generation_service import embed_text

settings = get_settings()


async def retrieve(query: str, top_k: int | None = None) -> list[dict]:
    """Hybrid vector + keyword search with semantic ranking. Returns chunks sorted by
    relevance, each with document_id/filename/chunk_ref/snippet/score."""
    top_k = top_k or settings.retrieval_top_k
    query_vector = await embed_text(query)

    async with get_search_client() as client:
        results = await client.search(
            search_text=query,
            vector_queries=[
                VectorizedQuery(vector=query_vector, k_nearest_neighbors=top_k, fields="content_vector")
            ],
            query_type="semantic",
            semantic_configuration_name="uc1-semantic-config",
            select=["id", "document_id", "filename", "chunk_ref", "content"],
            top=top_k,
        )

        chunks = []
        async for result in results:
            chunks.append(
                {
                    "document_id": result["document_id"],
                    "filename": result["filename"],
                    "chunk_ref": result["chunk_ref"],
                    "snippet": result["content"],
                    "score": result.get("@search.reranker_score") or result.get("@search.score", 0.0),
                }
            )
        return chunks
