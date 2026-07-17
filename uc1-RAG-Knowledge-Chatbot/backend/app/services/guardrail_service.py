import re

from app.config import get_settings

settings = get_settings()

# Tolerates both the straight ASCII apostrophe and the curly Unicode one (U+2019) --
# generated text (GPT-5 in particular) reliably uses the latter, and a regex hardcoded
# to "'" only silently fails to match "don't" written as "don't" (differs from what
# it looks like at a glance -- see the is_soft_refusal bug this caused).
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


# The retrieval-score gate is a coarse "is anything loosely similar in the index"
# check -- it can't verify the retrieved chunks actually answer *this* question. A
# borderline-scoring but irrelevant chunk (e.g. generic handbook boilerplate for an
# unrelated question) can clear the threshold and still not ground a real answer.
# The model itself is instructed to say so when that happens (see SYSTEM_PROMPT) --
# this catches that signal after the fact so citations aren't attached to an answer
# that never actually used them.
_SOFT_REFUSAL_RE = re.compile(
    rf"\bi don{_APOS}?t have\b.{{0,60}}\b(information|data|details)\b.{{0,80}}\bknowledge base\b",
    re.IGNORECASE | re.DOTALL,
)


def is_soft_refusal(answer: str) -> bool:
    return bool(_SOFT_REFUSAL_RE.search(answer))
