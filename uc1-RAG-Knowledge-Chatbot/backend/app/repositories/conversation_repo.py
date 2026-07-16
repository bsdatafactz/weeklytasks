import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message


async def get_or_create(db: AsyncSession, conversation_id: uuid.UUID | None) -> Conversation:
    if conversation_id is not None:
        existing = await db.get(Conversation, conversation_id)
        if existing is not None:
            return existing
    conversation = Conversation()
    db.add(conversation)
    await db.flush()
    return conversation


async def list_conversations(db: AsyncSession) -> list[Conversation]:
    result = await db.execute(select(Conversation).order_by(Conversation.created_at.desc()))
    return list(result.scalars().all())


async def get_first_user_message(db: AsyncSession, conversation_id: uuid.UUID) -> str | None:
    result = await db.execute(
        select(Message.content)
        .where(Message.conversation_id == conversation_id, Message.role == "user")
        .order_by(Message.created_at)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def delete_conversation(db: AsyncSession, conversation_id: uuid.UUID) -> bool:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None:
        return False
    await db.delete(conversation)
    await db.flush()
    return True
