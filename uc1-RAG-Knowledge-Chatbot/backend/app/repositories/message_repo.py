import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Message


async def add_message(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    role: str,
    content: str,
    model: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    total_tokens: int | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
    )
    db.add(message)
    await db.flush()
    return message


async def get_message(db: AsyncSession, message_id: uuid.UUID) -> Message | None:
    return await db.get(Message, message_id)


async def update_message(
    db: AsyncSession,
    message_id: uuid.UUID,
    *,
    content: str,
    model: str | None,
    input_tokens: int | None,
    output_tokens: int | None,
    total_tokens: int | None,
) -> None:
    """Used by regenerate -- updates the existing row in place (same id, same
    created_at/ordering) rather than delete-then-recreate, so the client's reference to
    this message's id stays valid for a second regenerate on the same bubble."""
    message = await db.get(Message, message_id)
    if message is None:
        return
    message.content = content
    message.model = model
    message.input_tokens = input_tokens
    message.output_tokens = output_tokens
    message.total_tokens = total_tokens
    await db.flush()


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
