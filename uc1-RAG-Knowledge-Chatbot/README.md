# UC1 — RAG Knowledge Chatbot

Week 1 deliverable: an internal knowledge assistant that answers employee questions about
company policy/benefits/procedures, grounded only in the document corpus in `backend/resources/`.

## Stack

- Retrieval: Azure AI Search (hybrid vector + keyword, semantic ranker)
- Generation: Azure AI Foundry GPT-5 (Responses API, via the OpenAI v1-compatible endpoint)
- Embeddings: Azure AI Foundry `text-embedding-3-large` (compared against `text-embedding-3-small`)
- Relational data (documents, conversations, messages, citations): Postgres, local via Docker
- Backend: FastAPI (Python 3.11+, `uv`)
- Frontend: React (Vite), Tailwind, DataFactZ branding

## Layout

```
backend/            FastAPI app: routers -> services -> repositories, Alembic migrations
backend/resources/  source corpus (8 PDF, 4 DOCX, 4 HTML, 3 MD — 19 docs), baked into the
                     backend Docker image so ingestion works out of the box in a container
frontend/           React chat UI + admin view
docs/               design doc, architecture diagram, ERD, pattern justification,
                     retrieval-quality note, cost estimate
```

See `docs/design-doc.md` for the full architecture and pattern-justification table.

## Running it

```
cp backend/.env.example backend/.env   # fill in real Azure Search / Foundry keys
docker compose up -d --build
curl http://localhost:8001/api/v1/health
```

This starts three containers:

| Service | Host port | Notes |
|---|---|---|
| `postgres` | 5433 (`postgres:5432` inside the compose network) | Alembic migrations run automatically on backend container start |
| `backend` | 8001 (`8000` is already used by `day1-hello-world`'s backend on this machine) | FastAPI |
| `frontend` | 5173 | nginx serving the Vite production build |

Open `http://localhost:5173` for the chat UI once all three are up.

For local dev without Docker for the backend/frontend themselves (Postgres still needs
`docker compose up -d postgres`):
- Backend: `cd backend && uv run uvicorn app.main:app --reload --port 8000`, using
  `DATABASE_URL=postgresql+asyncpg://uc1:uc1@localhost:5433/uc1_rag` from `.env`.
- Frontend: `cd frontend && cp .env.example .env && npm install && npm run dev`.

## Docker images

Both `backend` and `frontend` are tagged `bsdatafactz/uc1-rag-{backend,frontend}:v1` in
`docker-compose.yml` (alongside `build:`, so `docker compose build` produces images under that
tag locally). To publish to Docker Hub:

```
docker login
docker compose build
docker push bsdatafactz/uc1-rag-backend:v1
docker push bsdatafactz/uc1-rag-frontend:v1
```

Note: the frontend image bakes `VITE_API_BASE`/`VITE_APP_API_KEY` in at build time (Vite
inlines them into the static bundle) — the build args in `docker-compose.yml` point at
`localhost:8001` for local use. A pushed/shared image would need rebuilding with build args
pointing at wherever the backend is actually reachable from the browser using it.
