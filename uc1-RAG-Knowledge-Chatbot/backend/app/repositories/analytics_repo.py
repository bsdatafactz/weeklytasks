from datetime import UTC, datetime, timedelta

from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import Date

from app.models import Conversation, Message


async def get_totals(db: AsyncSession) -> dict:
    conversation_count = await db.scalar(select(func.count()).select_from(Conversation))
    message_counts = (
        await db.execute(select(Message.role, func.count()).group_by(Message.role))
    ).all()
    counts_by_role = {role: count for role, count in message_counts}
    token_totals = (
        await db.execute(
            select(
                func.coalesce(func.sum(Message.input_tokens), 0),
                func.coalesce(func.sum(Message.output_tokens), 0),
                func.coalesce(func.sum(Message.total_tokens), 0),
            )
        )
    ).one()
    return {
        "conversation_count": conversation_count or 0,
        "user_message_count": counts_by_role.get("user", 0),
        "assistant_message_count": counts_by_role.get("assistant", 0),
        "input_tokens": token_totals[0],
        "output_tokens": token_totals[1],
        "total_tokens": token_totals[2],
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


async def get_messages_per_day(db: AsyncSession, days: int = 14) -> list[dict]:
    since = datetime.now(UTC) - timedelta(days=days - 1)
    day_col = cast(Message.created_at, Date)
    result = await db.execute(
        select(day_col, func.count())
        .where(Message.created_at >= since, Message.role == "user")
        .group_by(day_col)
        .order_by(day_col)
    )
    counts_by_day = {str(day): count for day, count in result.all()}

    series = []
    for offset in range(days):
        day = (since + timedelta(days=offset)).date()
        series.append({"date": str(day), "count": counts_by_day.get(str(day), 0)})
    return series
