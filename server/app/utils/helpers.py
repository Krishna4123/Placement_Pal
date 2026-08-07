"""
app/utils/helpers.py
─────────────────────
General-purpose utility helpers.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


def generate_session_id() -> str:
    """Return a new UUID4 string for use as a session identifier."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


def truncate_text(text: str, max_chars: int = 500) -> str:
    """Truncate a string to max_chars and append '…' if needed."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "…"


def flatten_list(nested: list[list]) -> list:
    """Flatten a one-level nested list."""
    return [item for sublist in nested for item in sublist]
