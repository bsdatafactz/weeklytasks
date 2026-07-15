# Day 1 Hello-World

DataFactZ AI Engineering Internship Program — Day 1 environment-verification smoke test.

A minimal full-stack app: a FastAPI backend with one endpoint that calls an LLM (OpenAI), and a React frontend, styled with DataFactZ brand colors, that displays the response.

## Prerequisites

- Python 3.11+ and [uv](https://docs.astral.sh/uv/)
- Node.js LTS with npm
- An OpenAI API key

## Backend

```bash
cd backend
uv sync
cp .env.example .env   # then fill in OPENAI_API_KEY
uv run uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

Env vars (`backend/.env`):

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Your issued OpenAI key |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `APP_API_KEY` | Shared secret the frontend must send as `x-api-key`; defaults to `dev-local-key` |

## Frontend

```bash
cd frontend
npm install
cp .env.example .env   # values already match the backend defaults
npm run dev
```

Runs at `http://localhost:5173`.

`APP_API_KEY` (backend) and `VITE_APP_API_KEY` (frontend) must match.

## What it does

Enter a name in the UI, submit, and the frontend calls `POST /api/v1/greet` on the backend, which asks the configured LLM for a one-sentence greeting and returns it for display.
