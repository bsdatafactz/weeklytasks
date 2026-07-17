# UC1 — RAG Knowledge Chatbot: Problem Statement

## Business framing

A mid-size enterprise client's employees need quick, trustworthy answers to policy, benefits,
and procedure questions. Today those answers live scattered across a stack of PDFs, DOCX
files, and wiki pages — finding the right passage means searching multiple documents by hand,
and there's no guarantee the answer found is current or complete. This project builds an
internal knowledge assistant that answers natural-language questions **grounded only in an
official document corpus**, never from the model's general knowledge, so employees get a fast,
accurate, auditable answer with a citation back to its source instead of an LLM improvising.

## User

Any employee at the client company who has an HR/policy/benefits question — the assistant
replaces "search the intranet / ask HR" for the common case, not "read documents cover to
cover." Secondary user: an admin (HR/IT) who manages the document corpus and monitors what's
indexed.

## Success criteria

- A question with an answer in the corpus gets a correct, cited answer, referencing the
  specific source document and section — not just "somewhere in the handbook."
- A question with **no** answer in the corpus gets an honest refusal ("I don't have that in
  the knowledge base"), never a hallucinated answer borrowed from the model's general
  training. Verified against 10 real test questions in `retrieval-quality-note.md`, including
  two deliberately out-of-corpus negative cases.
- An attempt to override the system's instructions via prompt injection ("ignore your
  instructions and...") does not cause the assistant to abandon grounding or comply with the
  injected instruction. Verified against two live attempts in `guardrail-demo.md`.
- An admin can see what's indexed (document list, chunk counts) and trigger a re-index without
  redeploying anything.
- The system holds a multi-turn conversation — a vague follow-up referencing an earlier turn
  ("tell me more about that") still resolves to the right answer, not a spurious refusal.

## Out of scope (Week 1)

- Authentication/authorization beyond a single shared API key — no per-employee login, roles,
  or document-level access control.
- Multi-tenant support — one corpus, one client, no tenant isolation.
- Production-grade Azure hosting for Postgres/backend/frontend — local Docker Postgres is a
  documented deviation (no provisioning access in the shared Resource Group this week); the
  scalability section of the design doc describes the production migration path.
- Feedback loops (thumbs up/down), automated evaluation harnesses (RAGAS/LLM-as-judge), and
  hybrid-search re-ranking experiments — listed as stretch goals only if core is solid.
- Ingesting new document types beyond PDF/DOCX/HTML/Markdown, or a corpus larger than the 20
  documents assembled for this build.
