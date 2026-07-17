from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message


async def get_totals(db: AsyncSession) -> dict:
    conversation_count = await db.scalar(select(func.count()).select_from(Conversation))
    question_count = await db.scalar(select(func.count()).where(Message.role == "user"))
    # A refused turn is still saved as an assistant message, just with no model attached
    # (see chat.py) -- answered + refused always equals question_count by construction,
    # so this is the same split usage_by_model uses, not a second, inconsistent count.
    answered_count = await db.scalar(
        select(func.count()).where(Message.role == "assistant", Message.model.is_not(None))
    )
    refused_count = await db.scalar(
        select(func.count()).where(Message.role == "assistant", Message.model.is_(None))
    )
    total_tokens = await db.scalar(select(func.coalesce(func.sum(Message.total_tokens), 0)))
    return {
        "conversation_count": conversation_count or 0,
        "question_count": question_count or 0,
        "answered_count": answered_count or 0,
        "refused_count": refused_count or 0,
        "total_tokens": total_tokens or 0,
    }


async def get_usage_by_model(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(
            Message.model,
            func.count(),
            func.coalesce(func.sum(Message.input_tokens), 0),
            func.coalesce(func.sum(Message.output_tokens), 0),
            func.coalesce(func.sum(Message.total_tokens), 0),
        )
        .where(Message.model.is_not(None))
        .group_by(Message.model)
        .order_by(func.count().desc())
    )
    return [
        {
            "model": model,
            "message_count": count,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
        }
        for model, count, input_tokens, output_tokens, total_tokens in result.all()
    ]
