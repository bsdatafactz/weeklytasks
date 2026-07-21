# Weekly Tasks — DataFactZ AI Engineering Internship

Code for the 5-week AI Engineering Internship Program at DataFactZ. Each folder is a
self-contained deliverable with its own README covering setup and what it does.

Day 1's environment-verification exercise and the program's briefs/templates live in
[`datafactz-internship-exercises`](https://github.com/bsdatafactz/datafactz-internship-exercises).

## Structure

| Folder | Week | What it is |
| --- | --- | --- |
| [`uc1-RAG-Knowledge-Chatbot/`](uc1-RAG-Knowledge-Chatbot/) | Week 1 | RAG Knowledge Chatbot (Azure AI Search + Foundry stack) |
| `week2-document-extraction/` | Week 2 | Unstructured Document Extraction (open-source stack) |
| `week3-4-breach-analytics/` | Weeks 3–4 | Breach Analytics at Scale (agentic, justified stack) |
| `week5-innovation-pitch/` | Week 5 | Innovation Pitch — own enterprise use case |

Folders for weeks not yet started don't exist until that week begins.

## Conventions

- One folder per use case, each with its own `README.md` (setup + what it does).
- Backend: Python 3.11+, FastAPI, `uv` for dependency management.
- Frontend: React (Vite), Tailwind, DataFactZ brand colors/components shared across apps.
- Secrets live in `.env` files, gitignored — never committed. `.env.example` documents the
  required variables for each app.
