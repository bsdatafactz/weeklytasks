from fastapi import APIRouter, Depends
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


@router.post("/reindex", response_model=IndexingRunOut)
async def reindex(db: AsyncSession = Depends(get_db)) -> IndexingRunOut:
    await ingestion_service.ingest_all(db, triggered_by="admin-ui")
    runs = await indexing_run_repo.list_runs(db, limit=1)
    return IndexingRunOut.model_validate(runs[0])
