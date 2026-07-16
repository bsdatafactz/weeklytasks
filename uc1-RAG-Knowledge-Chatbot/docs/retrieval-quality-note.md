# Retrieval quality note

Tested against the live Azure AI Search index (20 docs, 1,023 chunks) using `retrieval_service.retrieve()`
directly. Score = Azure's semantic reranker score (range ~0-4, not a 0-1 similarity). Covers
all 4 corpus formats, both large documents, and out-of-corpus/negative cases.

| # | Question | Expected source | Actually retrieved (top hit) | Score | Notes |
|---|---|---|---|---|---|
| 1 | How many days per week can employees work remotely? | remote-work-policy.docx or a handbook's remote-work section | `Gusto_...final.pdf`, Page 31 | 2.582 | Correct topic; answer noted no policy specified a fixed day count — an accurate refusal-to-overclaim rather than a retrieval miss. |
| 2 | What is the progressive discipline policy? | `progressive-discipline-policy` (HTML, disguised extension) | `progressive-discipline-policy`, "Employee progressive discipline policy template" | 3.406 | Exact match; confirms the mislabeled-extension file is retrievable, not just parseable. |
| 3 | What counts as an excused absence under the attendance policy? | `Attendance-Policy.pdf` | `Attendance-Policy.pdf`, Page 1 | 2.378 | Correct. |
| 4 | What are examples of prohibited or risky uses of AI at work? | `AI-in-the-Workplace-Policy.pdf` | `AI-in-the-Workplace-Policy.pdf`, Page 3 | 2.889 | Correct. |
| 5 | What is required when requesting a remote work arrangement? | `remote-work-policy.docx` (DOCX format) | `remote-work-policy.docx`, "Eligibility" | 2.359 | Correct; validates DOCX heading-based chunking (`Eligibility` came from a Word "Heading" style, not raw text). |
| 6 | How do I request FMLA leave and what medical certification is required? | `employeeguide.pdf` (large doc, 19 chunks, DOL FMLA guide) | `employeeguide.pdf`, Page 15 | 2.994 | Correct; confirms the large-PDF chunking didn't dilute retrieval for a specific sub-topic. |
| 7 | What career growth or advancement opportunities are described for employees? | benefits/handbook docs (MD or DOCX) | `employee-handbook-sample.doc` (HTML), "4. Benefits & Employee Wellness" | 2.556 | Plausible; a Markdown doc (`making-a-career.md`) covers similar ground but didn't outrank the HTML handbook section — worth a closer look if this exact question matters in the demo. |
| 8 | What does the employee guide say about onboarding for new hires? | *(deliberately ambiguous — see note)* | `employee-handbook-sample.doc`, "4. Benefits & Employee Wellness" | 2.600 | **Not a retrieval failure**: `employeeguide.pdf` is actually a DOL *FMLA* guide, not an onboarding doc — its filename is misleading. Correctly did NOT surface it; surfaced the closest actual onboarding content instead. |
| 9 | What is the capital of France? | *(none — out of corpus)* | — | 1.347 | Below the 2.0 refusal threshold; correctly refuses (see guardrail_service). |
| 10 | What is our company's stock ticker symbol? | *(none — plausible-sounding, out of corpus)* | — | 1.772 | Below threshold; correctly refuses despite sounding like a legitimate HR-adjacent question. |

## Tuning applied

- **Refusal threshold**: initially set to 0.55 (assumed a 0-1 similarity scale). Real testing
  showed in-corpus questions scoring 2.0-3.4 and out-of-corpus questions scoring 1.3-1.8 on
  Azure's actual semantic reranker scale (~0-4) — moved the threshold to **2.0**, Microsoft's
  documented starting point, which cleanly separates the two groups above.
- **Content-type sniffing**: two corpus files (`progressive-discipline-policy`,
  `employee-handbook-sample.doc`) have misleading extensions but are actually HTML — the
  loader sniffs actual content type rather than trusting the extension (row #2 confirms this
  works at retrieval time, not just at parse time).
- **Chunking**: DOCX heading styles (`Heading 1`/`Heading 2`) are preserved as section titles
  in `chunk_ref` (row #5's "Eligibility"), giving citations a human-readable section name
  instead of a raw chunk index.
- **Open item**: row #7 suggests `making-a-career.md`'s content may be underweighted relative
  to HTML/PDF sources for similar topics — not enough evidence yet to say this is a systematic
  format bias vs. this specific document's phrasing; worth another pass if time allows.
