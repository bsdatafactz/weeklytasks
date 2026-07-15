# UC1 — RAG Knowledge Chatbot

Week 1 deliverable: an internal knowledge assistant that answers employee questions about
company policy/benefits/procedures, grounded only in the document corpus in `resources/`.

## Stack

- Retrieval: Azure AI Search (hybrid vector + keyword, semantic ranker)
- Generation: Azure AI Foundry (DeepSeek V3.2 default, GPT-5.5 compared)
- Embeddings: Azure AI Foundry `text-embedding-3-large` (compared against `text-embedding-3-small`)
- Relational data (documents, conversations, messages, citations): Postgres, local via Docker
- Backend: FastAPI (Python 3.11+, `uv`)
- Frontend: React (Vite), Tailwind, DataFactZ branding

## Layout

```
resources/    source corpus (9 PDF, 4 DOCX, 4 HTML, 3 MD — 20 docs)
backend/      FastAPI app: routers -> services -> repositories, Alembic migrations
frontend/     React chat UI + admin view
docs/         design doc, architecture diagram, ERD, pattern justification,
              retrieval-quality note, cost estimate
```

See the architecture plan and pattern-justification table for design rationale (design doc
under `docs/` once drafted).
