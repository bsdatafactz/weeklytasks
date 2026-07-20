import re

from app.config import get_settings

settings = get_settings()

# Tolerates both the straight ASCII apostrophe and the curly Unicode one (U+2019) --
# generated text (GPT-5 in particular) reliably uses the latter, and a regex hardcoded
# to "'" only silently fails to match "don't" written as "don't" (differs from what
# it looks like at a glance).
_APOS = "['’]"

_INJECTION_PATTERNS = [
    r"ignore (all )?(previous|prior|above) instructions",
    r"disregard (the )?(system|previous) prompt",
    r"reveal (your|the) (system prompt|instructions)",
    r"you are now",
    r"act as (if|though) you (have no|are not)",
    rf"pretend (you{_APOS}re|you are)",
    r"new instructions?:",
    r"do anything now",
    r"jailbreak",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def screen_injection(text: str) -> tuple[bool, str | None]:
    """Returns (flagged, matched_pattern). Flagged input is still answered, but grounded
    strictly in retrieved context — the guardrail's job is to prevent the injected text from
    overriding the system prompt, not to block the message outright."""
    match = _INJECTION_RE.search(text)
    if match:
        return True, match.group(0)
    return False, None


def should_refuse(top_score: float | None) -> bool:
    if top_score is None:
        return True
    return top_score < settings.retrieval_score_threshold


# A borderline-scoring but irrelevant chunk (e.g. generic handbook boilerplate for an
# unrelated question) can clear the coarse retrieval-score gate alongside genuinely
# relevant ones -- e.g. asking about retirement pulls in an on-topic 401(k) chunk *and*
# an unrelated FMLA-leave chunk that scored just high enough. The model is instructed to
# cite inline as "[filename, chunk_ref]" (see generation_service.SYSTEM_PROMPT) for
# exactly this reason: only chunks whose marker actually appears in the answer were used
# to ground it.
#
# An earlier version of this used a separate regex to detect a full "I don't have that"
# refusal and blanked out every citation whenever it matched -- but a hedged, *partial*
# answer ("I don't have an exact number, but here's what the docs do say [...]") also
# matches that phrasing while still citing real sources, so the blunt regex wiped
# legitimate citations off a substantive answer. Matching per-chunk against what the
# answer actually cites handles both cases correctly on its own: a true refusal cites
# nothing and naturally reduces to an empty list, and a hedged-but-real answer keeps
# whatever it actually grounded itself in.
#
# The model doesn't always cite one bracket per source -- it sometimes bundles several
# as "[fileA, refA; fileB, refB]" in a single bracket despite the system prompt asking
# for one each. Matching the whole "[filename, chunk_ref]" string as one literal
# substring misses that case, so each bracket group is checked for both pieces
# co-occurring rather than requiring an exact bracket-per-citation match.
_BRACKET_GROUP_RE = re.compile(r"\[([^\]]+)\]")


# filter_cited_chunks alone still leaves sources attached to answers that *open* with
# "I don't have that information" and only mention real sources as supporting color for
# the disclaimer (e.g. "...retiree benefits aren't described, though active-employee
# benefits include X, Y, Z [cited]"). That's a real citation by the bracket-matching
# rule, but showing a "Sources" panel on an answer whose headline is "I don't have this"
# reads as contradictory to a user. Only the opening is checked (not "anywhere in the
# text", which is what caused the false positives filter_cited_chunks itself replaced) --
# a disclaimer later in an otherwise-confident answer is a normal hedge, not a refusal.
_DISCLAIMER_LEAD_RE = re.compile(
    rf"^\s*(?:[-*]\s*|\d+\.\s*)?i don{_APOS}?t have\b",
    re.IGNORECASE,
)


def leads_with_disclaimer(answer: str) -> bool:
    return bool(_DISCLAIMER_LEAD_RE.match(answer))


def filter_cited_chunks(answer: str, chunks: list[dict]) -> list[dict]:
    bracket_groups = _BRACKET_GROUP_RE.findall(answer)
    return [
        c
        for c in chunks
        if any(c["filename"] in group and c["chunk_ref"] in group for group in bracket_groups)
    ]
