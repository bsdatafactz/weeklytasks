from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import require_api_key
from app.repositories import document_repo, indexing_run_repo
from app.schemas.documents import DocumentOut, IndexingRunOut
from app.services import ingestion_service

router = APIRouter(prefix="/documents", tags=["documents"], dependencies=[Depends(require_api_key)])


@router.get("", response_model=list[DocumentOut])
async def list_documents(db: AsyncSession = Depends(get_db)) -> list[DocumentOut]:
    docs = await document_repo.list_documents(db)
    return [DocumentOut.model_validate(d) for d in docs]


@router.get("/runs", response_model=list[IndexingRunOut])
async def list_indexing_runs(db: AsyncSession = Depends(get_db)) -> list[IndexingRunOut]:
    runs = await indexing_run_repo.list_runs(db)
    return [IndexingRunOut.model_validate(r) for r in runs]


@router.post("/reindex", response_model=IndexingRunOut, status_code=202)
async def reindex(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)) -> IndexingRunOut:
    """Returns as soon as the run row exists, instead of waiting for the ~90s corpus
    pipeline to finish -- that used to block this request (and, since parsing/chunking ran
    synchronously on the event loop, every other request on the server) for the full
    duration. Ingestion now proceeds in the background; poll GET /documents/runs for
    completion."""
    run = await indexing_run_repo.start_run(db, triggered_by="admin-ui")
    await db.commit()
    background_tasks.add_task(ingestion_service.run_ingestion_background, run.id)
    return IndexingRunOut.model_validate(run)
