import uuid

from pydantic import BaseModel


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str
    model: str | None = None


class RegenerateRequest(BaseModel):
    message_id: uuid.UUID
    model: str | None = None
