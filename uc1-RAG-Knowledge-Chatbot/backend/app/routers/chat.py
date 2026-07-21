import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session_factory, get_db
from app.dependencies import require_api_key
from app.repositories import citation_repo, conversation_repo, message_repo
from app.schemas.chat import ChatRequest, RegenerateRequest
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


async def _stream_answer(
    *,
    conversation_id,
    question: str,
    history: list[tuple[str, str]],
    chunks: list[dict],
    refused: bool,
    flagged: bool,
    model: str,
    message_id_to_update=None,
) -> AsyncIterator[str]:
    """Shared by POST /chat and POST /chat/regenerate -- both differ only in how the
    question/history/chunks are assembled and whether the answer is saved as a new
    message or an update to an existing one; everything from here on (streaming,
    citation filtering, persistence) is identical."""
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
        async for delta in generation_service.stream_answer(question, chunks, history, model=model, usage_out=usage):
            parts.append(delta)
            yield _sse({"type": "delta", "text": delta})
        answer = "".join(parts)

    # The retrieval-score gate can't verify the retrieved chunks actually answer *this*
    # question -- a borderline-scoring but irrelevant chunk can clear it alongside
    # genuinely relevant ones. Keep only the citations the answer actually grounds
    # itself in; a true refusal cites nothing and this naturally reduces to an empty
    # list on its own. Separately, an answer whose *opening* is a "no knowledge base"
    # disclaimer reads as contradictory with a Sources panel attached, even when it
    # goes on to cite something as supporting color -- drop citations there too.
    if refused or guardrail_service.leads_with_disclaimer(answer):
        final_citations: list[dict] = []
    else:
        final_citations = guardrail_service.filter_cited_chunks(answer, citations_payload)

    # Fresh session: the request-scoped `db` above isn't guaranteed to still be open by
    # the time this generator resumes after streaming starts.
    async with async_session_factory() as db2:
        if message_id_to_update is not None:
            # Regenerate: update the existing row in place (same id) so the client's
            # reference to this message stays valid for a second regenerate on the same
            # bubble, instead of delete-then-recreate drifting to a new id it never
            # learns about.
            await citation_repo.delete_by_message(db2, message_id_to_update)
            await message_repo.update_message(
                db2,
                message_id_to_update,
                content=answer,
                model=None if refused else model,
                input_tokens=usage.get("input_tokens"),
                output_tokens=usage.get("output_tokens"),
                total_tokens=usage.get("total_tokens"),
            )
            assistant_message_id = message_id_to_update
        else:
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
            assistant_message_id = assistant_message.id
        await db2.commit()

        # Saved as its own transaction, after the message itself is safely committed:
        # a citation can reference a document_id that's since been deleted or never
        # existed in Postgres (a real incident -- a stale Azure AI Search entry left
        # over from a corpus/database reset crashed the whole response mid-stream,
        # after the answer had already been sent to the user, because the failure
        # happened inside the same transaction as the message save). Isolating it here
        # means a bad citation can never again take down the message it's attached to.
        if final_citations:
            try:
                await citation_repo.add_citations(db2, assistant_message_id, final_citations)
                await db2.commit()
            except Exception:
                logger.exception("failed_to_save_citations", extra={"message_id": str(assistant_message_id)})
                await db2.rollback()
                final_citations = []

    yield _sse({"type": "done", "total_tokens": usage.get("total_tokens"), "citations": final_citations})


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

    return StreamingResponse(
        _stream_answer(
            conversation_id=conversation.id,
            question=request.message,
            history=history,
            chunks=chunks,
            refused=refused,
            flagged=flagged,
            model=model,
        ),
        media_type="text/event-stream",
    )


@router.post("/regenerate")
async def regenerate(request: RegenerateRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    """Redoes the answer for a question already asked, without duplicating it in
    conversation history: re-runs retrieval + generation against the same preceding
    question/history and updates the existing assistant message in place, rather than
    appending a second copy of the question the way a plain new /chat call would."""
    target = await message_repo.get_message(db, request.message_id)
    if target is None or target.role != "assistant":
        raise HTTPException(status_code=404, detail="Assistant message not found")

    all_messages = await message_repo.full_history(db, target.conversation_id)
    target_index = next((i for i, m in enumerate(all_messages) if m.id == target.id), None)
    preceding = all_messages[:target_index]
    if not preceding or preceding[-1].role != "user":
        raise HTTPException(status_code=400, detail="No question found to regenerate an answer for")

    question = preceding[-1].content
    history = [(m.role, m.content) for m in preceding[:-1]]
    model = generation_service.resolve_model(request.model)
    flagged, pattern = guardrail_service.screen_injection(question)
    if flagged:
        logger.warning("prompt_injection_flagged", extra={"pattern": pattern})

    retrieval_query = await generation_service.condense_query(question, history)
    chunks = await retrieval_service.retrieve(retrieval_query)
    top_score = chunks[0]["score"] if chunks else None
    refused = guardrail_service.should_refuse(top_score)

    return StreamingResponse(
        _stream_answer(
            conversation_id=target.conversation_id,
            question=question,
            history=history,
            chunks=chunks,
            refused=refused,
            flagged=flagged,
            model=model,
            message_id_to_update=target.id,
        ),
        media_type="text/event-stream",
    )
