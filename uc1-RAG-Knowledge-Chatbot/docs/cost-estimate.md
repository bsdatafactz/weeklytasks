# Cost estimate

Token volumes below are measured against the real corpus and a real chat turn — not
estimates. Dollar figures are left as `<rate>` placeholders: this is a training-program Foundry
resource, not a standard pay-as-you-go subscription, so list pricing from the public Azure
calculator may not reflect the actual billing rate. Plug in the current per-1M-token rate from
your Azure pricing page for `text-embedding-3-large` and GPT-5 to get dollar figures.

## Methodology

- **Ingestion (one-time + per re-index)**: measured by running the real chunker against the
  full corpus and counting tokens with the same `cl100k_base` encoding used for chunking:
  **1,023 chunks, 366,702 embedding tokens total** (avg 358.5 tokens/chunk). Re-index frequency
  assumed monthly unless the corpus churns faster.
- **Chat (recurring, scales with users)**: measured one real end-to-end turn (question: "How
  many days per week can employees work remotely?", top-5 retrieved chunks):
  - System instructions: 93 tokens
  - Retrieved context (top-5 chunks): 2,508 tokens
  - Question: 10 tokens
  - Generated answer: 138 tokens
  - **Total: 2,749 tokens/turn** (2,611 input + 138 output), plus one embedding call for the
    question (~10-50 tokens, negligible).
  - This is the dominant cost driver at scale, not storage or retrieval — context size (top-k ×
    avg chunk size) matters more than anything else in this line item, which is why top-k=5
    and ~500-800 token chunks were chosen deliberately (see pattern-justification table).
- **Retrieval**: Azure AI Search pricing is tier/replica/partition-based, not per-query — cost
  is a step function of scale (upgrade tier or add replicas), not linear per-user cost.
- **Storage**: Postgres (local — no cost while local; note the migration cost to Azure
  Database for PostgreSQL Flexible Server if/when access is granted).

## 100 users vs. 5,000 users

Assumes 5 chat turns/user/day (an internal HR assistant, not a high-frequency tool).

| | 100 users | 5,000 users |
|---|---|---|
| Turns/day | 500 | 25,000 |
| Generation tokens/day | 500 × 2,749 = 1,374,500 | 25,000 × 2,749 = 68,725,000 |
| Generation cost/day | 1.3745 × `<rate per 1M tokens>` | 68.725 × `<rate per 1M tokens>` |
| Peak RPM (worst case: all users, 1 turn/min) | 100 | 5,000 |
| GPT-5 RPM headroom | 100 / 150,000 = 0.07% | 5,000 / 150,000 = 3.3% |
| AI Search tier needed | Basic (semantic ranker required) | Basic — same tier scales via replicas, not a tier change, until query volume is much higher |
| Embedding cost (one-time full re-index) | 0.367 × `<rate per 1M tokens>` (same for both — independent of user count) | |

**Takeaway**: generation is the dominant recurring cost and scales linearly with turns, but
GPT-5's quota (150K RPM) has enormous headroom even at 5,000 users — 3.3% of the ceiling at a
deliberately pessimistic peak-concurrency assumption. Ingestion cost is fixed and tiny relative
to ongoing chat volume once more than a handful of users are active daily.
