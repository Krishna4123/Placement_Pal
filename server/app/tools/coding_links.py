"""
app/tools/coding_links.py
──────────────────────────
LangChain @tool for fetching curated coding practice links
from the local JSON data store.

Wrapped with @tool so it can be passed directly into CrewAI agents
and LangGraph nodes.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger(__name__)

_DATA_FILE = Path(__file__).parent.parent / "data" / "coding_links.json"


def _load_coding_links() -> list[dict[str, Any]]:
    """Load all coding resource links from the JSON data file."""
    if not _DATA_FILE.exists():
        logger.warning("coding_links.json not found at %s", _DATA_FILE)
        return []
    with _DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


@tool
def get_coding_links(topic: str) -> list[dict[str, Any]]:
    """
    Retrieve curated coding practice links for a specific DSA topic.

    Use this to find practice problems and tutorials for topics like
    'Arrays', 'Dynamic Programming', 'Graphs', 'Trees', 'Binary Search', etc.

    Args:
        topic: The DSA topic name (case-insensitive, partial match supported).

    Returns:
        List of link dicts with 'topic', 'difficulty', 'platform', 'url', 'description'.
    """
    links = _load_coding_links()
    if not topic:
        return links
    topic_lower = topic.lower()
    matched = [
        link for link in links
        if topic_lower in link.get("topic", "").lower()
    ]
    # Fall back to all links if no match found
    return matched if matched else links


@tool
def get_all_coding_links() -> list[dict[str, Any]]:
    """
    Retrieve all available coding practice resource links.

    Returns:
        Complete list of all coding resource links.
    """
    return _load_coding_links()
