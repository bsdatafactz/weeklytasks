# Cost estimate

Filled in once real chunk counts and token volumes are known from the ingestion run (build
checkpoint #4) and a handful of representative chat turns (build checkpoint #6).

## Methodology

- **Ingestion (one-time + per re-index)**: chunk count × embedding tokens/chunk ×
  `text-embedding-3-large` price. Re-index frequency assumed monthly unless corpus churns
  faster.
- **Chat (recurring, scales with users)**: average tokens/turn (question + retrieved context
  + history + generation) × turns/user/day × active users × generation model price. This is
  the dominant cost driver at scale, not storage or retrieval.
- **Retrieval**: Azure AI Search pricing is tier/replica/partition-based, not per-query — cost
  is a step function of scale (upgrade tier or add replicas) rather than linear per-user cost.
- **Storage**: Postgres (local — no cost while local; note the migration cost to Azure
  Database for PostgreSQL Flexible Server if/when access is granted).

## 100 users vs. 5,000 users

| | 100 users | 5,000 users |
|---|---|---|
| Est. daily chat turns | | |
| Est. daily generation tokens | | |
| Generation cost/day | | |
| AI Search tier needed | | |
| Embedding cost (one-time ingest) | | |
| Notes | | |
