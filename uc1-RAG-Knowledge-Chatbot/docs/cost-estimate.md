# Cost estimate

Token volumes below are measured against the real corpus and a real chat turn — not
estimates. Dollar figures are left as `<rate>` placeholders: this is a training-program Foundry
resource, not a standard pay-as-you-go subscription, so list pricing from the public Azure
calculator may not reflect the actual billing rate. Plug in the current per-1M-token rate from
your Azure pricing page for `text-embedding-3-large` and GPT-5 to get dollar figures.

## Methodology

- **Ingestion (one-time + per re-index)**: measured by running the real chunker against the
  full corpus and counting tokens with the same `cl100k_base` encoding used for chunking:
  **481 chunks, 135,605 embedding tokens total** (avg 281.9 tokens/chunk). Re-measured
  2026-07-20 after a corpus audit removed two off-topic federal-agency documents that had
  made up 58% of the original 1,023-chunk index (see `design-doc.md` §2) — ingestion cost
  dropped by more than half as a side effect of a correctness fix, not a cost optimization.
  Re-index frequency assumed monthly unless the corpus churns faster.
- **Chat (recurring, scales with users)**: measured real end-to-end turns from the live
  `messages` table (question: "What is the attendance policy for tardiness?", top-5 retrieved
  chunks, GPT-5):
  - Input tokens (system instructions + retrieved context + question + history): 2,334
  - Output tokens: 156
  - **Total: 2,490 tokens/turn**, plus one embedding call for the question (~10-50 tokens,
    negligible).
  - This reflects `reasoning.effort="minimal"` / `text.verbosity="low"` (GPT-5; GPT-5.5 uses
    `"none"`/`"low"`, DeepSeek V3.2 supports neither param) — added 2026-07-20 after measuring
    that the *default* reasoning effort was generating thousands of hidden reasoning tokens
    per turn (4,593 total tokens on one measured turn, ~28s to first token) with no visible
    benefit for a grounded-QA task. This is a real, measured 45%+ token reduction per turn
    from that one change alone, on top of the corpus fix's effect on context-chunk quality.
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
| Generation tokens/day | 500 × 2,490 = 1,245,000 | 25,000 × 2,490 = 62,250,000 |
| Generation cost/day | 1.245 × `<rate per 1M tokens>` | 62.25 × `<rate per 1M tokens>` |
| Peak RPM (worst case: all users, 1 turn/min) | 100 | 5,000 |
| GPT-5 RPM headroom | 100 / 150,000 = 0.07% | 5,000 / 150,000 = 3.3% |
| AI Search tier needed | Basic (semantic ranker required) | Basic — same tier scales via replicas, not a tier change, until query volume is much higher |
| Embedding cost (one-time full re-index) | 0.136 × `<rate per 1M tokens>` (same for both — independent of user count) | |

**Takeaway**: generation is the dominant recurring cost and scales linearly with turns, but
GPT-5's quota (150K RPM) has enormous headroom even at 5,000 users — 3.3% of the ceiling at a
deliberately pessimistic peak-concurrency assumption. Ingestion cost is fixed and tiny relative
to ongoing chat volume once more than a handful of users are active daily. Both the corpus
audit and the reasoning-effort tuning cut real, measured cost — worth noting in the demo as
concrete numbers, not just "we made it faster."
