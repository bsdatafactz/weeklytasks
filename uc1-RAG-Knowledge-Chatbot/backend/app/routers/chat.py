import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session_factory, get_db
from app.dependencies import require_api_key
from app.repositories import citation_repo, conversation_repo, message_repo
from app.schemas.chat import ChatRequest
from app.services import generation_service, guardrail_service, retrieval_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(require_api_key)])

REFUSAL_MESSAGE = (
    "I don't have that information in the knowledge base I was given, so I can't answer "
    "this reliably. Try rephrasing, or ask about a topic covered in the indexed documents."
)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.get("/models")
async def list_models() -> list[dict]:
    return [
        {"id": model_id, "label": label, "default": model_id == generation_service.settings.generation_model_default}
        for model_id, label in generation_service.AVAILABLE_MODELS.items()
    ]


@router.post("")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    flagged, pattern = guardrail_service.screen_injection(request.message)
    if flagged:
        logger.warning("prompt_injection_flagged", extra={"pattern": pattern})

    model = generation_service.resolve_model(request.model)

    conversation = await conversation_repo.get_or_create(db, request.conversation_id)
    history_rows = await message_repo.recent_history(db, conversation.id)
    history = [(m.role, m.content) for m in history_rows]

    retrieval_query = await generation_service.condense_query(request.message, history)
    chunks = await retrieval_service.retrieve(retrieval_query)
    top_score = chunks[0]["score"] if chunks else None
    refused = guardrail_service.should_refuse(top_score)

    await message_repo.add_message(db, conversation_id=conversation.id, role="user", content=request.message)
    await db.commit()

    conversation_id = conversation.id

    async def event_stream() -> AsyncIterator[str]:
        citations_payload = (
            []
            if refused
            else [
                {
                    "document_id": str(c["document_id"]),
                    "filename": c["filename"],
                    "chunk_ref": c["chunk_ref"],
                    "snippet": c["snippet"],
                    "score": c["score"],
                }
                for c in chunks
            ]
        )
        yield _sse(
            {
                "type": "meta",
                "conversation_id": str(conversation_id),
                "refused": refused,
                "injection_flagged": flagged,
                "citations": citations_payload,
                "model": model,
            }
        )

        usage: dict = {}
        if refused:
            answer = REFUSAL_MESSAGE
            yield _sse({"type": "delta", "text": answer})
        else:
            parts: list[str] = []
            async for delta in generation_service.stream_answer(
                request.message, chunks, history, model=model, usage_out=usage
            ):
                parts.append(delta)
                yield _sse({"type": "delta", "text": delta})
            answer = "".join(parts)

        # The retrieval-score gate can't verify the retrieved chunks actually answer
        # *this* question -- a borderline-scoring but irrelevant chunk can clear it and
        # still not ground a real answer. If the model's own answer says as much, the
        # citations it was given were never actually used -- drop them, even though
        # retrieval "passed".
        soft_refused = (not refused) and guardrail_service.is_soft_refusal(answer)
        final_citations = [] if (refused or soft_refused) else citations_payload

        # Fresh session: the request-scoped `db` above isn't guaranteed to still be open
        # by the time this generator resumes after streaming starts.
        async with async_session_factory() as db2:
            assistant_message = await message_repo.add_message(
                db2,
                conversation_id=conversation_id,
                role="assistant",
                content=answer,
                model=None if refused else model,
                input_tokens=usage.get("input_tokens"),
                output_tokens=usage.get("output_tokens"),
                total_tokens=usage.get("total_tokens"),
            )
            if final_citations:
                await citation_repo.add_citations(db2, assistant_message.id, chunks)
            await db2.commit()

        yield _sse({"type": "done", "total_tokens": usage.get("total_tokens"), "citations": final_citations})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
