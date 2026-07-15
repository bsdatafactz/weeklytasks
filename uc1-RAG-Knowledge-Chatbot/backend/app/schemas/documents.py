import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    format: str
    status: str
    chunk_count: int
    indexed_at: datetime | None

    class Config:
        from_attributes = True


class IndexingRunOut(BaseModel):
    id: uuid.UUID
    started_at: datetime
    finished_at: datetime | None
    doc_count: int
    chunk_count: int
    status: str
    triggered_by: str

    class Config:
        from_attributes = True
