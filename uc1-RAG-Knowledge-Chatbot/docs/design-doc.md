# UC1 — RAG Knowledge Chatbot: Solution Design Doc

## 1. Problem statement

Employees need quick, trustworthy answers to policy/benefits/procedure questions without
digging through a stack of PDFs, DOCX files, and wiki pages. Today those answers live
scattered across 20 source documents in 4 formats. This project builds an internal knowledge
assistant that answers questions **grounded only in that corpus** — with citations back to
the source document and section, a refusal path for out-of-scope questions, and resistance to
prompt-injection attempts — so employees get a fast, accurate, auditable answer instead of an
LLM improvising from general knowledge.

## 2. Corpus

20 documents, `uc1-RAG-Knowledge-Chatbot/resources/`: 9 PDF, 4 DOCX, 4 HTML, 3 Markdown —
including `progressive-discipline-policy` and `employee-handbook-sample.doc`, both HTML
content under a misleading extension. The ingestion loader sniffs actual content type
(`python-magic`) rather than trusting the extension, so both are correctly parsed as HTML;
confirmed by running the loader against the real corpus (all 20 files parse without error,
1,023 chunks total). Two PDFs are large (~9.5MB, ~6.8MB) and dominate raw chunk count (53 and
19 chunks respectively) — dwarfed by `deo_handbook.pdf` (322 chunks) and `wfahandbook.pdf`
(273 chunks), which are larger still. Retrieval testing deliberately includes queries against
the smaller, more specific documents too, so the index isn't validated only against the
largest files.

## 3. Architecture

Two independent pipelines behind a FastAPI backend, React frontend on top.

```mermaid
flowchart TB
    subgraph Ingestion["Ingestion pipeline (admin-triggered)"]
        A[resources/*.pdf .docx .md .html] --> B[Loader: content-sniff + per-format parser]
        B --> C[Normalizer: strip boilerplate, keep headings]
        C --> D[Chunker: structure-aware, ~500-800 tok, ~10-15% overlap]
        D --> E[Embedder: Foundry text-embedding-3-large]
        E --> F[(Azure AI Search index)]
        D --> G[(Postgres: documents, chunk metadata)]
    end

    subgraph Chat["Chat pipeline (per request)"]
        U[User question] --> GR1[guardrail_service: prompt-injection screen]
        GR1 --> R[retrieval_service: hybrid vector+keyword, semantic ranker]
        F --> R
        R --> CTX[Context assembly: top-k chunks + history budget]
        CTX --> GEN[generation_service: Foundry GPT-5 via Responses API]
        GEN --> GR2[guardrail_service: refusal check on low retrieval score]
        GR2 --> RESP[Response + inline citations]
        RESP --> G
    end

    ADMIN[Admin UI: doc list, chunk counts, re-index] --> Ingestion
    CHATUI[Chat UI: streaming, citations, history] --> Chat
```

### Backend layering

Routers (`/api/v1`) → services → repositories → external clients, following the pattern
already established in `day1-hello-world/backend` (Pydantic Settings, `.env`/`.env.example`,
`HTTPException`-based error handling, no 200-with-error-body responses).

```
routers/        chat.py, documents.py (admin), health.py
services/       ingestion_service, retrieval_service, generation_service, guardrail_service
repositories/   document_repo, conversation_repo, message_repo, citation_repo
clients/        azure_search_client, azure_foundry_client
```

### Frontend

React (Vite) + Tailwind, reusing `day1-hello-world/frontend`'s DataFactZ theme (gradient,
navy, Inter, Lucide icons). Chat view: streaming responses, citation chips linking to source
doc + section, a distinct visual state for refusals. Admin view: indexed-document table with
chunk counts and a re-index button.

## 4. Data model (Postgres, local via Docker)

```mermaid
erDiagram
    DOCUMENTS ||--o{ CITATIONS : "cited by"
    CONVERSATIONS ||--o{ MESSAGES : contains
    MESSAGES ||--o{ CITATIONS : has
    INDEXING_RUNS }o--|| DOCUMENTS : processes

    DOCUMENTS {
        uuid id PK
        text filename
        text format
        text source_path
        text status
        int chunk_count
        timestamp indexed_at
        text checksum
    }
    CONVERSATIONS {
        uuid id PK
        timestamp created_at
    }
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
        timestamp created_at
    }
    CITATIONS {
        uuid id PK
        uuid message_id FK
        uuid document_id FK
        text chunk_ref
        text snippet
        float score
    }
    INDEXING_RUNS {
        uuid id PK
        timestamp started_at
        timestamp finished_at
        int doc_count
        int chunk_count
        text status
        text triggered_by
    }
```

`indexing_runs` backs the admin re-index button and gives an audit trail of every ingestion
run — who/what triggered it, how many docs/chunks, success/failure.

## 5. Pattern justification

Every non-trivial decision below was made against at least two named, specifically-reasoned
alternatives.

| Decision | Chosen | Rejected alternatives (why) |
|---|---|---|
| Chunking | Structure-aware — split on headings/sections, ~500-800 tokens, ~10-15% overlap | **Fixed-size 512-token windows**: ignores document structure, frequently splits mid-section, breaks citation-to-section mapping. **Semantic/embedding-based chunking**: adds embedding calls during chunking itself for marginal gain on well-structured policy docs — not worth the extra latency/cost here. |
| Retrieval | Hybrid (vector + keyword) with semantic ranker | **Pure vector search**: misses exact-term matches like policy names, section numbers, acronyms that show up verbatim in questions. **Pure keyword search**: misses paraphrased/natural-language questions that don't share vocabulary with the source doc. |
| Embedding model | `text-embedding-3-large` (Azure AI Foundry) | **`text-embedding-3-small`**: cheaper/faster but measurably lower retrieval quality on the nuanced language in HR policy text — compared head-to-head on the retrieval-quality test set (§7). **AI Search integrated vectorization**: adds a second managed-service dependency for embeddings the team can already generate directly via Foundry — no benefit once a Foundry embedding deployment exists. |
| Generation model | GPT-5 | **GPT-5.5**: no measurable quality edge over GPT-5 for this grounded-QA task, and its Foundry quota is far more constraining — 5M TPM / 5K RPM vs. GPT-5's 15M TPM / 150K RPM. The RPM gap (30x) matters most: request-count limits bind before token limits under many concurrent short chat turns, so GPT-5.5 would hit quota walls first as usage scales toward 5,000 users. **DeepSeek V3.2**: weakest quota of the three (500K TPM / 500 RPM) and requires a separate Azure AI Inference (serverless) endpoint/SDK route instead of the OpenAI-compatible one already used for embeddings — extra operational surface with no offsetting benefit for this task. |
| Relational database | Postgres, local via Docker | **Azure Database for PostgreSQL Flexible Server**: no provisioning access in the shared Resource Group. **Cosmos DB**: same access constraint, and its document model is a worse fit than Postgres's relational joins for `conversations → messages → citations`. This is a documented deviation from the "Azure-hosted" default — production path is to migrate to Azure Database for PostgreSQL Flexible Server once access is granted (see §6). |

## 6. Scalability (100 → 5,000 users)

- **Generation quota is the binding constraint, not the backend.** GPT-5's Foundry quota
  (15M TPM / 150K RPM) gives real headroom: at ~1.5K tokens/turn (context + history +
  answer), 150K RPM caps out around 225M tokens/min of *request* capacity before the 15M TPM
  *token* ceiling is even reached — so RPM, not TPM, is the number to watch as concurrent
  users grow. At 5,000 users with a generous 1 turn/user/minute peak, that's 5,000 RPM — 3%
  of the 150K RPM ceiling, comfortable headroom without a quota increase request. This is
  also why GPT-5.5 (5K RPM) was rejected in §5: the same 5,000-user peak would already be at
  its limit.
- **Backend**: stateless FastAPI, async I/O throughout — horizontally scalable behind Azure
  Container Apps with autoscale as the target production topology (not deployed there today
  due to access constraints, but the code has no in-process state that would block it).
- **Retrieval**: Azure AI Search scales via replicas (query throughput) and partitions (index
  size) independently of the backend.
- **Relational data**: migrate from local Postgres to Azure Database for PostgreSQL Flexible
  Server with connection pooling (pgbouncer) once access is granted; add read replicas if
  conversation history read load grows.
- **Caching**: a Redis cache in front of `retrieval_service` for repeated/common questions
  reduces both AI Search query volume and generation calls at scale.
- **Rate limiting**: per-user request limits protect the generation budget as user count grows.
- **Cost implication**: see `cost-estimate.md` for the 100-user vs. 5,000-user comparison —
  the main cost driver at scale is generation tokens, not retrieval or storage, so caching and
  prompt/context-size discipline matter more than infrastructure sizing.

## 7. Retrieval quality note

See `retrieval-quality-note.md` — 10 real test questions against the live index, including
the discovery that the initial refusal threshold (0.55) was calibrated for the wrong score
scale, corrected to 2.0 against real in-corpus vs. out-of-corpus scores.

## 8. Cost estimate

See `cost-estimate.md` — filled in once real chunk counts and embedding/generation token
volumes are known from the ingestion run.
