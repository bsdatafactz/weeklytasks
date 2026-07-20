# Retrieval quality note

Re-tested 2026-07-20 against the live Azure AI Search index (19 docs, 481 chunks, all
short-named per `design-doc.md` §2's naming audit) via the full `POST /api/v1/chat` endpoint —
this table shows what the user actually sees: the final, per-citation-filtered sources
alongside the answer. Score = Azure's semantic reranker score (range ~0-4, not a 0-1
similarity). Covers all 4 corpus formats and out-of-corpus/negative cases.

| # | Question | Cited (filtered to what the answer actually used) | Score | Notes |
|---|---|---|---|---|
| 1 | How many days per week can employees work remotely? | *(none)* | — | Answer opens with "I don't have that information" — none of the sources specify a fixed day count, so citations are correctly suppressed even though real handbook sources were retrieved (see "Tuning applied"). |
| 2 | What is the progressive discipline policy? | `progressive-discipline-policy`, "Policy brief & purpose"; `progressive-discipline-policy`, "How to invoke progressive discipline" | 3.053, 2.814 | Exact match; confirms the mislabeled-extension file (HTML content, no `.html` extension) is retrievable, not just parseable. |
| 3 | What counts as an excused absence under the attendance policy? | *(none)* | — | Answer opens with "I don't have that information" — the attendance template doesn't enumerate excused-absence examples. |
| 4 | What are examples of prohibited or risky uses of AI at work? | `ai-policy.pdf`, Page 3; `ai-policy.pdf`, Page 2 | 2.889, 2.402 | Correct. |
| 5 | What is required when requesting a remote work arrangement? | `hr-manual.docx`, "Flexible Working Arrangements"; `remote-work.docx`, "Eligibility" | 2.666, 2.359 | Correct; validates DOCX heading-based chunking (`Eligibility` came from a Word "Heading" style, not raw text). |
| 6 | How do I request FMLA leave and what medical certification is required? | `handbook-nonprofit.pdf`, Page 24; `fmla-guide.pdf`, Pages 15/14/12/10 | 3.017, 2.994-2.85 | Correct; `fmla-guide.pdf` is the DOL's dedicated FMLA guide (formerly `employeeguide.pdf` — its old name was generic and misleading). |
| 7 | What onboarding steps happen for a new hire? | `onboarding-checklist.html`, "Onboarding checklists & templates"; `career-growth.md`, "Your First Year"; `handbook-howto-gusto.pdf`, Page 13 | 2.57, 2.271, 2.157 | Correct; three different formats (HTML, Markdown, PDF) all surface relevant onboarding content. |
| 8 | What career growth or advancement opportunities are described for employees? | `career-growth.md`, "Mastery & Titles" | 2.272 | Correct; the dedicated career-growth Markdown doc is the top hit. |
| 9 | What are the benefits of a retired employee? | *(none)* | — | **The original bug report, re-tested**: previously this question surfaced a `wfahandbook.pdf` chunk defining *federal-employee* separation/retirement codes — plausible-looking but from a document that had no business being in this corpus. That document is gone; the answer now honestly opens with "I don't have that information" for retiree-specific benefits, so citations are suppressed even though real 401(k)/benefits sources were retrieved underneath. |
| 10 | How do policy changes get proposed? → (follow-up) "tell me more about that" | `policy-changes.md`, "Proposals"/"Discussion Meetings"/"Continuing Work" (turn 1); same + "Slack #handbook" (turn 2) | 2.489-2.361 → 2.534-1.847 | Multi-turn follow-up correctly resolved via `generation_service.condense_query()`. |
| 11 | What is the capital of France? | *(none — out of corpus)* | — | Correctly refuses. |
| 12 | What is our company's stock ticker symbol? | *(none — plausible-sounding, out of corpus)* | — | Correctly refuses despite sounding like a legitimate HR-adjacent question. |

## Tuning applied

- **Corpus naming, round 2 (2026-07-20)**: with 9 of 19 files touching "benefits" or "handbook"
  in some way (e.g. `employee-benefits-summary-template.docx`,
  `shrm-sample-employee-handbook-2023.docx`), the descriptive-but-long names from round 1 were
  still hard to visually tell apart. Shortened everything with a consistent `benefits-`/
  `handbook-` prefix scheme — see `design-doc.md` §2 for the full mapping. Re-ingested after
  renaming since checksums (and therefore `upsert_document`'s dedup key) are unchanged by a
  rename — the database and search index needed a full rebuild to pick up the new filenames at
  all, not just an incremental re-index.
- **Corpus audit, round 1 (2026-07-20)**: every document was opened and read, not trusted by
  filename. Found `deo_handbook.pdf` and `wfahandbook.pdf` were federal-agency
  internal-operations manuals (hiring-examiner procedures; workforce-analysis methodology) with
  nothing to do with employee HR policy, making up 58% of the entire chunk index — row #9 above
  is a direct before/after of the accuracy problem this caused. Both removed; three more files
  renamed to match their real content.
- **Citation display, "leads with disclaimer"**: rows #1, #3, and #9 all retrieve real,
  on-topic sources, but the model's answer opens with "I don't have that information" because
  none of them specify the exact thing asked (a day count, specific excused-absence examples,
  retiree-specific benefits). Showing a Sources panel on an answer whose headline is a
  disclaimer read as contradictory, so citations are now dropped whenever the answer's opening
  sentence is that kind of disclaimer — not just on a full refusal. See
  `guardrail_service.leads_with_disclaimer()`.
- **Citation filtering, bracket bundling**: the model doesn't always cite one bracket per
  source — it sometimes bundles several as `[fileA, refA; fileB, refB]`. Citations are matched
  by checking each bracket group for the filename and chunk_ref co-occurring, not by requiring
  an exact one-bracket-per-citation string match.
- **Generation speed/verbosity**: GPT-5 defaulted to a heavy reasoning effort with no
  `reasoning.effort`/`text.verbosity` hint — measured 28+ seconds of silent "thinking" before
  the first token on one turn. Tuned to `reasoning.effort="minimal"`, `text.verbosity="low"` for
  GPT-5 (GPT-5.5 uses `"none"`/`"low"`; DeepSeek V3.2 accepts neither param). Cut first-token
  latency from ~28-30s to ~3-6s across all three models, verified live against each.
- **Refusal threshold**: 2.0 on Azure's semantic reranker scale (~0-4), separating in-corpus
  scores (2.2-3.1 in this test set) from out-of-corpus scores (below 2.0, rows #11-12).
- **Content-type sniffing**: `progressive-discipline-policy` and `handbook-sample.doc` have
  non-HTML extensions but are actually HTML — the loader sniffs actual content type rather than
  trusting the extension (row #2 confirms this works at retrieval time, not just parse time).
  Kept under these exact names deliberately as a live test of that behavior.
- **Chunking**: DOCX heading styles (`Heading 1`/`Heading 2`) are preserved as section titles in
  `chunk_ref` (row #5's "Eligibility"), giving citations a human-readable section name instead
  of a raw chunk index.
