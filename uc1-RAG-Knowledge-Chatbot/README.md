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

See `docs/design-doc.md` for the full architecture and pattern-justification table.

## Running it

```
cp backend/.env.example backend/.env   # fill in real Azure Search / Foundry keys
docker compose up -d --build
curl http://localhost:8001/api/v1/health
```

This starts Postgres (`localhost:5433` on the host, `postgres:5432` inside the compose
network) and the backend (`localhost:8001` — `8000` is already used by `day1-hello-world`'s
backend on this machine), running Alembic migrations automatically on container start.

For local dev without Docker for the backend itself (Postgres still needs `docker compose up
-d postgres`): `cd backend && uv run uvicorn app.main:app --reload --port 8000`, using
`DATABASE_URL=postgresql+asyncpg://uc1:uc1@localhost:5433/uc1_rag` from `.env`.
