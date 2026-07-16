# AI usage log

Per Handbook §10: log where AI assistance was used, what it produced, and how it was verified.

| Date | What AI helped with | Tool | Verified by |
|---|---|---|---|
| 2026-07-15 | Architecture design (ingestion + chat pipeline, backend layering, Postgres schema/ERD, pattern-justification rationale for chunking/retrieval/embedding/generation/DB choices) | Claude Code | Reviewed against the Week 1 brief's functional requirements and technical constraints; stack choices (Azure AI Search, Foundry models, local Postgres) cross-checked against actual account access before adopting |
| 2026-07-15 | Design doc, cost-estimate and retrieval-quality-note templates (structure only — figures to be filled in from real ingestion/chat runs) | Claude Code | Owner reviews and fills in actual measured numbers before submission; templates not treated as final content |
| 2026-07-16 | Backend implementation (routers/services/repositories, SQLAlchemy models, Alembic migration, Docker Compose, ingestion pipeline: content-sniffing loader, structure-aware chunker, embedding+indexing) | Claude Code | Ran against the real corpus and real Azure credentials, not just read: loader/chunker validated against all 20 files before any Azure calls; full ingestion run executed live (1,023 chunks indexed); retrieval spot-checked with 10 real questions; refusal threshold bug (calibrated for wrong score scale) and an index-orphaning bug (interrupted run left stale Search entries) were both caught by actually running the code, not by inspection, then fixed and re-verified |
| 2026-07-16 | Azure Foundry integration (client wiring for GPT-5 generation, text-embedding-3-large embeddings) | Claude Code | Initial assumption (classic Azure OpenAI endpoint, Chat Completions API) was wrong; corrected after the owner supplied the real endpoint, verified live against real credentials (Responses API call, multi-turn history, embedding call) before writing it into the service code |
