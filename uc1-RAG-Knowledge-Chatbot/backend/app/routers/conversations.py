import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import require_api_key
from app.repositories import citation_repo, conversation_repo, message_repo
from app.schemas.conversations import CitationOut, ConversationDetail, ConversationSummary, MessageOut

router = APIRouter(prefix="/conversations", tags=["conversations"], dependencies=[Depends(require_api_key)])

PREVIEW_MAX_LEN = 60


@router.get("", response_model=list[ConversationSummary])
async def list_conversations(db: AsyncSession = Depends(get_db)) -> list[ConversationSummary]:
    conversations = await conversation_repo.list_conversations(db)
    summaries = []
    for conversation in conversations:
        first_message = await conversation_repo.get_first_user_message(db, conversation.id)
        preview = (first_message or "New conversation").strip()
        if len(preview) > PREVIEW_MAX_LEN:
            preview = preview[:PREVIEW_MAX_LEN].rstrip() + "…"
        summaries.append(
            ConversationSummary(id=conversation.id, created_at=conversation.created_at, preview=preview)
        )
    return summaries


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ConversationDetail:
    messages = await message_repo.full_history(db, conversation_id)
    if not messages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    message_ids = [m.id for m in messages]
    citation_rows = await citation_repo.list_by_messages_with_filename(db, message_ids)
    citations_by_message: dict[uuid.UUID, list[CitationOut]] = {}
    for citation, filename in citation_rows:
        citations_by_message.setdefault(citation.message_id, []).append(
            CitationOut(
                document_id=citation.document_id,
                filename=filename,
                chunk_ref=citation.chunk_ref,
                snippet=citation.snippet,
                score=citation.score,
            )
        )

    return ConversationDetail(
        id=conversation_id,
        created_at=messages[0].created_at,
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
                citations=citations_by_message.get(m.id, []),
            )
            for m in messages
        ],
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(conversation_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    deleted = await conversation_repo.delete_conversation(db, conversation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await db.commit()
