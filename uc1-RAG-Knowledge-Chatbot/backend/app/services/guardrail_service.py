import re

from app.config import get_settings

settings = get_settings()

_INJECTION_PATTERNS = [
    r"ignore (all )?(previous|prior|above) instructions",
    r"disregard (the )?(system|previous) prompt",
    r"reveal (your|the) (system prompt|instructions)",
    r"you are now",
    r"act as (if|though) you (have no|are not)",
    r"pretend (you're|you are)",
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
