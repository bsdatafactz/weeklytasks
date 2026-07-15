import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IndexingRun


async def start_run(db: AsyncSession, triggered_by: str = "admin") -> IndexingRun:
    run = IndexingRun(started_at=datetime.now(UTC), status="running", triggered_by=triggered_by)
    db.add(run)
    await db.flush()
    return run


async def finish_run(db: AsyncSession, run_id: uuid.UUID, *, doc_count: int, chunk_count: int, status: str) -> None:
    run = await db.get(IndexingRun, run_id)
    if run is None:
        return
    run.finished_at = datetime.now(UTC)
    run.doc_count = doc_count
    run.chunk_count = chunk_count
    run.status = status
    await db.flush()


async def list_runs(db: AsyncSession, limit: int = 20) -> list[IndexingRun]:
    result = await db.execute(select(IndexingRun).order_by(IndexingRun.started_at.desc()).limit(limit))
    return list(result.scalars().all())
