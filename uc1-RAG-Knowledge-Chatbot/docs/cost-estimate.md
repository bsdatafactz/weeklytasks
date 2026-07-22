# Cost estimate

Token volumes below are measured against the real corpus and real production chat turns — not
estimates. Dollar figures are left as `<rate>` placeholders: this is a training-program Foundry
resource, not a standard pay-as-you-go subscription, so list pricing from the public Azure
calculator may not reflect the actual billing rate. Plug in the current per-1M-token rate from
your Azure pricing page for `text-embedding-3-large`, GPT-5, and GPT-5.5 to get dollar figures.

## Methodology

- **Ingestion (one-time + per re-index)**: measured by running the real chunker against the
  current 20-document corpus and counting tokens with the same `cl100k_base` encoding used for
  chunking: **179 chunks, 18,639 embedding tokens total** (avg 104.1 tokens/chunk). Re-measured
  2026-07-22 after the corpus was replaced with a generated fictional "Contoso Corp" policy set
  (see `design-doc.md` §2) — down from the prior corpus's 481 chunks / 135,605 tokens. To be
  explicit: this drop reflects a deliberately shorter, more evenly-sized corpus, not an
  optimization applied to the same content — the two measurements aren't apples-to-apples.
  Re-index frequency assumed monthly unless the corpus churns faster.
- **Chat (recurring, scales with users)**: measured real end-to-end turns from the live
  `messages` table in production, against the current corpus, both models users have actually
  selected:
  - **GPT-5** (2 turns measured): avg input 1,087 tokens, avg output 265 tokens — **avg total
    1,351 tokens/turn**.
  - **GPT-5.5** (6 turns measured): avg input 1,463 tokens, avg output 151 tokens — **avg total
    1,613 tokens/turn**. Input is higher (GPT-5.5 appears to consume more context tokens for the
    same retrieved chunks) but output is shorter — a real, measured quality/verbosity trade-off
    between the two models, not just a cost one.
  - Both are meaningfully lower than the old corpus's measured 2,490 tokens/turn: the current
    corpus's retrieved chunks average 104 tokens vs. the old corpus's 282, so the same top-k=5
    retrieval pulls proportionally less context regardless of model.
  - Both reflect the `reasoning.effort="minimal"` / `text.verbosity="low"` tuning established
    2026-07-20 (GPT-5.5 uses `"none"`/`"low"`) — still in effect, independent of corpus.
  - Plus one embedding call per question (~10-50 tokens, negligible).
  - This is the dominant cost driver at scale, not storage or retrieval — context size (top-k ×
    avg chunk size) matters more than anything else in this line item, which is why top-k=5
    and structure-aware chunking were chosen deliberately (see pattern-justification table).
- **Retrieval**: Azure AI Search pricing is tier/replica/partition-based, not per-query — cost
  is a step function of scale (upgrade tier or add replicas), not linear per-user cost.
- **Storage**: production now runs on Azure Database for PostgreSQL Flexible Server (see
  `design-doc.md` §4); local dev still uses Docker Postgres at no cost. Storage cost for this
  data volume (conversations/messages/citations, no document bodies) is negligible relative to
  generation.

## Cost per 1,000 chat turns (model comparison)

| | GPT-5 | GPT-5.5 |
|---|---|---|
| Avg tokens/turn | 1,351 | 1,613 |
| Tokens per 1,000 turns | 1.351M | 1.613M |
| Cost per 1,000 turns | 1.351 × `<rate per 1M tokens>` | 1.613 × `<rate per 1M tokens>` |
| Foundry RPM quota | 150,000 | 5,000 |

GPT-5.5 costs ~19% more per turn on these measured samples and has 30x less RPM headroom —
reinforcing the generation-model choice in `design-doc.md` §5 on both axes, not just quota.

## 100 users vs. 5,000 users

Assumes 5 chat turns/user/day (an internal HR assistant, not a high-frequency tool), GPT-5 as
the default model.

| | 100 users | 5,000 users |
|---|---|---|
| Turns/day | 500 | 25,000 |
| Generation tokens/day | 500 × 1,351 = 675,500 | 25,000 × 1,351 = 33,775,000 |
| Generation cost/day | 0.6755 × `<rate per 1M tokens>` | 33.775 × `<rate per 1M tokens>` |
| Peak RPM (worst case: all users, 1 turn/min) | 100 | 5,000 |
| GPT-5 RPM headroom | 100 / 150,000 = 0.07% | 5,000 / 150,000 = 3.3% |
| AI Search tier needed | Basic (semantic ranker required) | Basic — same tier scales via replicas, not a tier change, until query volume is much higher |
| Embedding cost (one-time full re-index) | 0.0186 × `<rate per 1M tokens>` (same for both — independent of user count) | |

**Takeaway**: generation is still the dominant recurring cost and still scales linearly with
turns, and GPT-5's quota headroom is unchanged (3.3% of 150K RPM at 5,000 users). The corpus
swap to a leaner, evenly-sized document set cut both ingestion cost (135,605 → 18,639 embedding
tokens) and per-turn generation cost (2,490 → 1,351 tokens for GPT-5) — real, measured
reductions worth citing as concrete numbers in the demo, alongside the honest caveat that the
corpus itself changed, so this isn't a pure efficiency win on identical content.
