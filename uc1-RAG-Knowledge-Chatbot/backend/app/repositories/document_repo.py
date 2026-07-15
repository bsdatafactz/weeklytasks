import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document


async def list_documents(db: AsyncSession) -> list[Document]:
    result = await db.execute(select(Document).order_by(Document.filename))
    return list(result.scalars().all())


async def get_by_checksum(db: AsyncSession, checksum: str) -> Document | None:
    result = await db.execute(select(Document).where(Document.checksum == checksum))
    return result.scalar_one_or_none()


async def upsert_document(
    db: AsyncSession, *, filename: str, format: str, source_path: str, checksum: str
) -> Document:
    existing = await get_by_checksum(db, checksum)
    if existing:
        return existing
    doc = Document(filename=filename, format=format, source_path=source_path, checksum=checksum)
    db.add(doc)
    await db.flush()
    return doc


async def mark_indexed(db: AsyncSession, document_id: uuid.UUID, chunk_count: int) -> None:
    doc = await db.get(Document, document_id)
    if doc is None:
        return
    doc.status = "indexed"
    doc.chunk_count = chunk_count
    doc.indexed_at = datetime.now(UTC)
    await db.flush()
