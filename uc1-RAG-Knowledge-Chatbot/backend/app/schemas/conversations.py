import uuid
from datetime import datetime

from pydantic import BaseModel


class ConversationSummary(BaseModel):
    id: uuid.UUID
    created_at: datetime
    preview: str


class CitationOut(BaseModel):
    document_id: uuid.UUID
    filename: str
    chunk_ref: str
    snippet: str
    score: float


class MessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    citations: list[CitationOut] = []


class ConversationDetail(BaseModel):
    id: uuid.UUID
    created_at: datetime
    messages: list[MessageOut]
