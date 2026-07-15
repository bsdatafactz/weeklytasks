import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation


async def get_or_create(db: AsyncSession, conversation_id: uuid.UUID | None) -> Conversation:
    if conversation_id is not None:
        existing = await db.get(Conversation, conversation_id)
        if existing is not None:
            return existing
    conversation = Conversation()
    db.add(conversation)
    await db.flush()
    return conversation
