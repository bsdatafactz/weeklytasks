import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Citation, Document


async def delete_by_message(db: AsyncSession, message_id: uuid.UUID) -> None:
    await db.execute(delete(Citation).where(Citation.message_id == message_id))
    await db.flush()


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


async def list_by_messages_with_filename(db: AsyncSession, message_ids: list[uuid.UUID]) -> list[tuple[Citation, str]]:
    """Citation model has no filename column -- joins Document for it, needed when
    restoring a conversation's full history (live turns get filename from the
    retrieval_service chunk dicts directly, not from this table)."""
    if not message_ids:
        return []
    result = await db.execute(
        select(Citation, Document.filename)
        .join(Document, Citation.document_id == Document.id)
        .where(Citation.message_id.in_(message_ids))
    )
    return list(result.all())
