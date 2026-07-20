# Retrieval quality note

Re-tested 2026-07-20 against the live Azure AI Search index (19 docs, 481 chunks) via the full
`POST /api/v1/chat` endpoint (not just raw retrieval) — this table shows what the user actually
sees: the final, per-citation-filtered sources alongside the answer. Score = Azure's semantic
reranker score (range ~0-4, not a 0-1 similarity). Covers all 4 corpus formats and
out-of-corpus/negative cases. Original 20-doc/1,023-chunk results are superseded — two of those
20 documents were later found to be off-topic federal-agency handbooks and removed (see
`design-doc.md` §2), so the old numbers no longer reflect the real corpus.

| # | Question | Cited (filtered to what the answer actually used) | Score | Notes |
|---|---|---|---|---|
| 1 | How many days per week can employees work remotely? | `gusto-handbook-writing-guide.pdf`, Page 31; `employee-handbook-template-indeed.pdf`, Page 5 | 2.582, 2.149 | Correct topic; answer noted no source specifies a fixed day count — an honest partial answer, not a retrieval miss. |
| 2 | What is the progressive discipline policy? | `progressive-discipline-policy`, "Policy brief & purpose"; `shrm-sample-employee-handbook-2023.docx`, part 18/27; `progressive-discipline-policy`, "How to invoke progressive discipline" | 3.053, 2.843, 2.814 | Exact match; confirms the mislabeled-extension file (HTML content, no `.html` extension) is retrievable, not just parseable. |
| 3 | What counts as an excused absence under the attendance policy? | `attendance-policy.pdf`, Page 1 | 2.378 | Correct source; answer honestly notes the policy excerpt doesn't enumerate specific excused-absence examples. |
| 4 | What are examples of prohibited or risky uses of AI at work? | `ai-in-the-workplace-policy.pdf`, Page 3 | 2.889 | Correct. |
| 5 | What is required when requesting a remote work arrangement? | `remote-work-policy.docx`, "Eligibility" | 2.359 | Correct; validates DOCX heading-based chunking (`Eligibility` came from a Word "Heading" style, not raw text). |
| 6 | How do I request FMLA leave and what medical certification is required? | `employee-handbook-nonprofits-small-business.pdf`, Page 24; `dol-fmla-employee-guide.pdf`, Page 14 | 3.017, 2.968 | Correct; `dol-fmla-employee-guide.pdf` is the file formerly named `employeeguide.pdf` — renamed because its old name was generic and misleading for what's actually a DOL FMLA-specific guide. |
| 7 | What onboarding steps happen for a new hire? | `making-a-career.md`, "Your First Year"; `employee-handbook-sample.doc`, "4. Benefits & Employee Wellness" | 2.271, 2.181 | Correct; the Markdown source now surfaces as the top hit for onboarding, unlike the equivalent question in the pre-audit corpus. |
| 8 | What career growth or advancement opportunities are described for employees? | `employee-handbook-sample.doc`, "4. Benefits & Employee Wellness"; `making-a-career.md`, "Mastery & Titles" | 2.556, 2.272 | Correct; both a real handbook section and the dedicated career-growth Markdown doc surface. |
| 9 | What are the benefits of a retired employee? | `employee-handbook-sample.doc`, "4. Benefits & Employee Wellness"; `shrm-sample-employee-handbook-2023.docx`, part 26/27; `employee-benefits-summary-template.docx`, "FINANCIAL SECURITY"; `employee-benefits-enrollment-guide.pdf`, Page 12 | 2.389, 2.251, 2.084, 1.917 | **The original bug report, re-tested**: previously this question surfaced a `wfahandbook.pdf` chunk defining *federal-employee* separation/retirement codes — plausible-looking but from a document that had no business being in this corpus. With that document removed, all four citations are genuinely on-topic (401(k), benefits summary, enrollment guide), and the answer honestly notes none of them describe *retiree-specific* (post-employment) benefits. |
| 10 | How do policy changes get proposed? → (follow-up) "tell me more about that" | `policy-changes-process.md`, "Proposals" (turn 1); same + "Continuing Work", "Discussion Meetings" (turn 2) | 2.489 → 2.516, 2.263, 2.239 | Multi-turn follow-up correctly resolved via `generation_service.condense_query()` — replaces the old test case that depended on `wfahandbook.pdf`, which no longer exists in the corpus. |
| 11 | What is the capital of France? | *(none — out of corpus)* | — | Correctly refuses. |
| 12 | What is our company's stock ticker symbol? | *(none — plausible-sounding, out of corpus)* | — | Correctly refuses despite sounding like a legitimate HR-adjacent question. |

## Tuning applied

- **Corpus audit (2026-07-20)**: every document was opened and read, not trusted by filename.
  Found `deo_handbook.pdf` (U.S. OPM federal hiring-examiner procedures) and `wfahandbook.pdf`
  (U.S. DOT internal workforce-analysis methodology) made up 595 of the original 1,023 chunks
  (58%) despite being completely unrelated to employee HR policy — row #9 above is a direct
  before/after of the accuracy problem this caused. Both removed; three more files renamed to
  match their real content (`employeeguide.pdf` → `dol-fmla-employee-guide.pdf`, etc. — see
  `design-doc.md` §2 for the full list).
- **Citation filtering, round 2**: the first fix (matching each citation's literal
  `[filename, chunk_ref]` string against the answer) had two bugs, both found by testing against
  real answers rather than trusting the logic: (1) the model doesn't always cite one bracket per
  source — it sometimes bundles several as `[fileA, refA; fileB, refB]`, which the literal-string
  match missed entirely; (2) a separate blunt "is this a full refusal" regex was zeroing out
  *all* citations on hedged-but-real answers like row #1 and #9 above, which cite real sources
  while also honestly noting a gap. Fixed by checking each bracket group for both the filename
  and chunk_ref co-occurring (handles bundling) and removing the separate all-or-nothing regex
  entirely — a true refusal now naturally cites nothing rather than needing a special case.
- **Generation speed/verbosity**: GPT-5 defaulted to a heavy reasoning effort with no
  `reasoning.effort`/`text.verbosity` hint — measured 28+ seconds of silent "thinking" before
  the first token on one turn, and 4,593 total tokens for a ~150-word visible answer. Tuned to
  `reasoning.effort="minimal"`, `text.verbosity="low"` for GPT-5 (GPT-5.5 uses `"none"`/`"low"` —
  it rejects `"minimal"`; DeepSeek V3.2 accepts neither param). Cut first-token latency from
  ~28-30s to ~3-6s across all three models, verified live against each.
- **Refusal threshold**: 2.0 on Azure's semantic reranker scale (~0-4), separating in-corpus
  scores (2.0-3.4 in this test set) from out-of-corpus scores (below 2.0, rows #11-12).
- **Content-type sniffing**: `progressive-discipline-policy` and `employee-handbook-sample.doc`
  have non-HTML extensions but are actually HTML — the loader sniffs actual content type rather
  than trusting the extension (row #2 confirms this works at retrieval time, not just parse
  time). Kept under these names deliberately as a live test of that behavior.
- **Chunking**: DOCX heading styles (`Heading 1`/`Heading 2`) are preserved as section titles in
  `chunk_ref` (row #5's "Eligibility"), giving citations a human-readable section name instead
  of a raw chunk index.
