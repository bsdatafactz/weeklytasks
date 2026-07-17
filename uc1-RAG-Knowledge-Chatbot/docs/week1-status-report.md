# DataFactZ | AI Engineering Internship — Weekly Status Report

| Field | Entry |
|---|---|
| Name | Brahmanya Sudulagunta |
| Week | 1 |
| Use case / assignment | UC1 — RAG Knowledge Chatbot |
| Hours spent this week | 35–40 |
| Date submitted | 2026-07-17 |

## 1. Summary

Built an internal HR/policy knowledge chatbot that answers employee questions grounded only in
a 20-document corpus (PDF/DOCX/HTML/Markdown), with citations, a working refusal path for
out-of-scope questions, and a guardrail against prompt-injection attempts. The full stack —
Azure AI Search retrieval, Azure AI Foundry (GPT-5) generation, a FastAPI backend, and a React
chat/admin UI — is running end-to-end in Docker with a real ingested index (1,023 chunks) and
has been tested against real questions, not just read for correctness.

## 2. Completed this week

- Design doc, architecture diagram (Mermaid), ERD, and pattern-justification table for every
  major decision (`docs/design-doc.md`).
- Ingestion pipeline: content-sniffing loader (handles two corpus files with misleading
  extensions), structure-aware chunker, embedding + Azure AI Search indexing — run live against
  the full corpus (1,023 chunks, 366,702 embedding tokens).
- Chat pipeline: hybrid retrieval with semantic ranker, citation-backed generation via GPT-5,
  streaming responses over SSE, multi-turn conversation history with query condensing for vague
  follow-ups.
- Refusal behavior and prompt-injection guardrail, both verified against real requests —
  `docs/retrieval-quality-note.md` (10 test questions) and `docs/guardrail-demo.md` (2 live
  injection attempts).
- React chat UI (streaming, citations, conversation history/persistence) and admin view
  (document list, chunk counts, re-index button, usage analytics), DataFactZ-branded, with
  dark/light theme.
- Model selection (GPT-5 / GPT-5.5 / DeepSeek V3.2) and per-message token-usage tracking.
- Cost estimate (100 vs. 5,000 users) and scalability section, both built from real measured
  token volumes rather than guesses.
- 14 backend unit tests covering the chunker and content-sniffing loader.
- Docker Compose stack (Postgres + backend + frontend), images published to Docker Hub.

## 3. Key decisions made — and the reasoning

- **Structure-aware chunking (headings, ~500–800 tokens, ~10–15% overlap)** over fixed-size
  windows or embedding-based chunking — fixed windows split mid-section and break the
  citation-to-section mapping this project depends on; embedding-based chunking added latency/
  cost for marginal gain on well-structured policy docs.
- **Hybrid retrieval (vector + keyword + semantic ranker)** over pure vector or pure keyword —
  pure vector missed exact-term matches (policy names, section numbers); pure keyword missed
  paraphrased questions.
- **`text-embedding-3-large` over `text-embedding-3-small`** — measurably better retrieval
  quality on nuanced HR-policy language, checked head-to-head on the retrieval-quality test set.
- **GPT-5 over GPT-5.5** — GPT-5.5 showed no quality edge for this task and has far less Foundry
  quota headroom (5K RPM vs. GPT-5's 150K RPM); at a 5,000-user peak, GPT-5.5 would already be
  at its ceiling.
- **Local Docker Postgres over Azure-hosted Postgres/Cosmos DB** — no provisioning access in the
  shared Resource Group this week; documented as a deviation with a migration path once access
  exists, rather than silently working around it.
- **Query condensing for follow-up questions** — a vague follow-up scored below the refusal
  threshold on its own (1.98) even though the prior turn had already retrieved the right chunk
  at 3.65; condensing the question against history before retrieval fixed this, at the cost of
  one extra GPT-5 call per turn with history (accepted given RPM headroom).
- **Reconciling citations against the model's actual answer, not just retrieval's pre-generation
  result** — found today that a borderline-scoring but irrelevant chunk could pass the refusal
  threshold while the model correctly said it didn't have the answer, yet citations still
  displayed. Citations are now dropped whenever the model's own answer indicates a refusal.

## 4. Challenges and blockers

- **Azure Foundry endpoint assumption was wrong initially** — assumed the classic Azure OpenAI
  Chat Completions shape; the actual resource uses the newer OpenAI-compatible Responses API.
  Caught by testing against real credentials, not by inspection.
- **Refusal threshold miscalibrated for the wrong score scale** — assumed a 0–1 similarity
  scale; Azure's semantic reranker actually scores ~0–4. Found by running real in-corpus vs.
  out-of-corpus questions and seeing the threshold misfire, then recalibrated to 2.0.
- **An interrupted ingestion run orphaned Azure Search entries** against a rolled-back Postgres
  document row — fixed by committing per document during ingestion instead of one commit at
  the end.
- **No Azure provisioning access for Postgres/Container Apps** in the shared Resource Group —
  worked around with local Docker Postgres, documented as a deviation with a scalability note
  on the production migration path. No blocker currently, but worth flagging if the team wants
  a hosted deployment before Friday.

## 5. What I learned

- Azure AI Foundry's newer resource type exposes an OpenAI-compatible **Responses API**, not
  the classic Chat Completions shape — worth checking the actual endpoint/API version before
  assuming based on documentation examples.
- Azure AI Search's semantic reranker score is on a **~0–4 scale**, not 0–1 — any
  threshold/gate logic needs to be calibrated against real query scores, not assumed.
- The value of testing against a running system instead of reading code: several of the real
  bugs this week (refusal threshold, index orphaning, vague-follow-up refusal, stale citations
  on a refusal) only surfaced by actually sending requests and inspecting the response.

## 6. Plan for next week

- Finish today's remaining Week 1 deliverables: presentation deck and rehearsal for the Friday
  demo.
- Kick off UC2 (Document Extraction) per the Week 2 brief — corpus/problem framing Monday.
- If time allows before Friday: revisit the open item in `retrieval-quality-note.md` (whether
  `making-a-career.md` is underweighted relative to HTML/PDF sources for similar topics).

## 7. Certification progress

| Item | Status |
|---|---|
| Courses completed / in progress this week | In progress — coursework underway, build was this week's priority |
| Practice test taken? Score? | Not yet |
| On track for 90% gate? What's weak? | Not yet assessed — no practice test taken this week to gauge against |

## 8. AI usage highlights

- Claude Code's first attempt at the Foundry client assumed the classic Azure OpenAI endpoint
  shape — wrong. Caught and corrected only after testing live against the real endpoint/API.
- Claude Code's initial refusal threshold (0.55) assumed a 0–1 similarity scale; real testing
  against the live index showed Azure's semantic reranker actually scores ~0–4, so the
  threshold was silently wrong until measured against real in-corpus/out-of-corpus questions.
- Today, caught a subtler bug in Claude Code's own generated logic: citations were attached
  purely from retrieval's pre-generation result and never reconciled against what the model's
  answer actually said, so a refusal could still show 5 citations. Found via manual testing
  ("Hello there what is anthropic"), not code review.
