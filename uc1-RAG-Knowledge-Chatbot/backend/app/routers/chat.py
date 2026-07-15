import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import require_api_key
from app.repositories import citation_repo, conversation_repo, message_repo
from app.schemas.chat import ChatRequest, ChatResponse, CitationOut
from app.services import generation_service, guardrail_service, retrieval_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(require_api_key)])

REFUSAL_MESSAGE = (
    "I don't have that information in the knowledge base I was given, so I can't answer "
    "this reliably. Try rephrasing, or ask about a topic covered in the indexed documents."
)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)) -> ChatResponse:
    flagged, pattern = guardrail_service.screen_injection(request.message)
    if flagged:
        logger.warning("prompt_injection_flagged", extra={"pattern": pattern})

    conversation = await conversation_repo.get_or_create(db, request.conversation_id)
    history_rows = await message_repo.recent_history(db, conversation.id)
    history = [(m.role, m.content) for m in history_rows]

    chunks = await retrieval_service.retrieve(request.message)
    top_score = chunks[0]["score"] if chunks else None

    await message_repo.add_message(db, conversation_id=conversation.id, role="user", content=request.message)

    if guardrail_service.should_refuse(top_score):
        answer = REFUSAL_MESSAGE
        await message_repo.add_message(db, conversation_id=conversation.id, role="assistant", content=answer)
        await db.commit()
        return ChatResponse(conversation_id=conversation.id, message=answer, refused=True, citations=[])

    answer = await generation_service.generate_answer(request.message, chunks, history)
    assistant_message = await message_repo.add_message(
        db, conversation_id=conversation.id, role="assistant", content=answer
    )
    await citation_repo.add_citations(db, assistant_message.id, chunks)
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        message=answer,
        refused=False,
        citations=[
            CitationOut(
                document_id=c["document_id"],
                filename=c["filename"],
                chunk_ref=c["chunk_ref"],
                snippet=c["snippet"],
                score=c["score"],
            )
            for c in chunks
        ],
    )
