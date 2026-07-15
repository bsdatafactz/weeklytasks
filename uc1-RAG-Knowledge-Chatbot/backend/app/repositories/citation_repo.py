import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Citation


async def add_citations(db: AsyncSession, message_id: uuid.UUID, citations: list[dict]) -> list[Citation]:
    rows = [
        Citation(
            message_id=message_id,
            document_id=c["document_id"],
            chunk_ref=c["chunk_ref"],
            snippet=c["snippet"],
            score=c["score"],
        )
        for c in citations
    ]
    db.add_all(rows)
    await db.flush()
    return rows
