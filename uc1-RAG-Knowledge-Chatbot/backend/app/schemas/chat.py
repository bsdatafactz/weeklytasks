import uuid

from pydantic import BaseModel


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str


class CitationOut(BaseModel):
    document_id: uuid.UUID
    filename: str
    chunk_ref: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message: str
    refused: bool
    citations: list[CitationOut]
