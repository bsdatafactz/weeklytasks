import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Message


async def add_message(db: AsyncSession, *, conversation_id: uuid.UUID, role: str, content: str) -> Message:
    message = Message(conversation_id=conversation_id, role=role, content=content)
    db.add(message)
    await db.flush()
    return message


async def recent_history(db: AsyncSession, conversation_id: uuid.UUID, limit: int = 10) -> list[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))


async def full_history(db: AsyncSession, conversation_id: uuid.UUID) -> list[Message]:
    """Uncapped, for restoring a conversation in the UI -- recent_history() is
    capped for prompt-context-size reasons, a different concern from this."""
    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    return list(result.scalars().all())
