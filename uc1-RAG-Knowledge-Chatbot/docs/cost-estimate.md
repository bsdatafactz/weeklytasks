# Cost estimate

Token volumes below are measured against the real corpus and real production chat turns — not
estimates. Dollar figures are left as `<rate>` placeholders: this is a training-program Foundry
resource, not a standard pay-as-you-go subscription, so list pricing from the public Azure
calculator may not reflect the actual billing rate. Plug in the current per-1M-token rate from
your Azure pricing page for `text-embedding-3-large`, GPT-5, GPT-5.5, and DeepSeek V3.2 to get
dollar figures.

## Methodology

- **Ingestion (one-time + per re-index)**: measured by running the real chunker against the
  current 24-document corpus and counting tokens with the same `cl100k_base` encoding used for
  chunking: **222 chunks, 23,378 embedding tokens total** (avg 105.3 tokens/chunk). Re-measured
  2026-07-22 after 4 documents were added to the original 20-document Contoso set (see
  `design-doc.md` §2) — up from 179 chunks / 18,639 tokens, proportional to the 4 added
  documents. Re-index frequency assumed monthly unless the corpus churns faster.
- **Chat (recurring, scales with users)**: measured real end-to-end turns from the live
  `messages` table in production, against the current corpus, all three selectable models:
  - **GPT-5** (9 turns measured): avg input 1,216 tokens, avg output 178 tokens — **avg total
    1,394 tokens/turn**.
  - **GPT-5.5** (6 turns measured): avg input 1,463 tokens, avg output 151 tokens — **avg total
    1,613 tokens/turn**.
  - **DeepSeek V3.2** (6 turns measured): avg input 1,360 tokens, avg output 97 tokens — **avg
    total 1,456 tokens/turn** — the shortest average output of the three, a real measured
    verbosity difference, not just a cost one.
  - Plus one embedding call per question (~10-50 tokens, negligible).
  - All three reflect the `reasoning.effort`/`text.verbosity` tuning established 2026-07-20
    (`"minimal"`/`"low"` for GPT-5, `"none"`/`"low"` for GPT-5.5; DeepSeek accepts neither param).
  - This is the dominant cost driver at scale, not storage or retrieval — context size (top-k ×
    avg chunk size) matters more than anything else in this line item, which is why top-k=5
    and structure-aware chunking were chosen deliberately (see pattern-justification table).
- **Retrieval**: Azure AI Search pricing is tier/replica/partition-based, not per-query — cost
  is a step function of scale (upgrade tier or add replicas), not linear per-user cost.
- **Storage**: production now runs on Azure Database for PostgreSQL Flexible Server (see
  `design-doc.md` §4); local dev still uses Docker Postgres at no cost. Storage cost for this
  data volume (conversations/messages/citations, no document bodies) is negligible relative to
  generation.

## Cost per 1,000 chat turns (3-model comparison)

| | GPT-5 | GPT-5.5 | DeepSeek V3.2 |
|---|---|---|---|
| Avg tokens/turn | 1,394 | 1,613 | 1,456 |
| Tokens per 1,000 turns | 1.394M | 1.613M | 1.456M |
| Cost per 1,000 turns | 1.394 × `<rate>` | 1.613 × `<rate>` | 1.456 × `<rate>` |
| Foundry RPM quota | 150,000 | 5,000 | 500 |
| Foundry TPM quota | 15M | 5M | 500K |

GPT-5.5 costs ~16% more per turn than GPT-5 on these measured samples; DeepSeek sits in between
on tokens/turn but has by far the weakest quota (500 RPM — 300x less than GPT-5), which is why
it was rejected in `design-doc.md` §5 despite being cost-competitive per turn. Quota, not
per-turn token cost, is what actually gates which model can serve 5,000 users.

## 100 users vs. 5,000 users

Assumes 5 chat turns/user/day (an internal HR assistant, not a high-frequency tool), GPT-5 as
the default model.

| | 100 users | 5,000 users |
|---|---|---|
| Turns/day | 500 | 25,000 |
| Generation tokens/day | 500 × 1,394 = 697,000 | 25,000 × 1,394 = 34,850,000 |
| Generation cost/day | 0.697 × `<rate per 1M tokens>` | 34.85 × `<rate per 1M tokens>` |
| Peak RPM (worst case: all users, 1 turn/min) | 100 | 5,000 |
| GPT-5 RPM headroom | 100 / 150,000 = 0.07% | 5,000 / 150,000 = 3.3% |
| AI Search tier needed | Basic (semantic ranker required) | Basic — same tier scales via replicas, not a tier change, until query volume is much higher |
| Embedding cost (one-time full re-index) | 0.0234 × `<rate per 1M tokens>` (same for both — independent of user count) | |

**Takeaway**: generation is still the dominant recurring cost and still scales linearly with
turns; GPT-5's quota headroom is effectively unchanged (3.3% of 150K RPM at 5,000 users). Real
measured data across all three selectable models now backs the model-choice reasoning in
`design-doc.md` §5 on cost, verbosity, and quota simultaneously, not quota alone.
