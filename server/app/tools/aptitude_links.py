"""
app/tools/aptitude_links.py
────────────────────────────
LangChain @tool for fetching curated aptitude/reasoning resource links
from the local JSON data store.

Wrapped with @tool so it can be passed directly into CrewAI agents.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger(__name__)

_DATA_FILE = Path(__file__).parent.parent / "data" / "aptitude_links.json"


def _load_aptitude_links() -> list[dict[str, Any]]:
    """Load all aptitude resource links from the JSON data file."""
    if not _DATA_FILE.exists():
        logger.warning("aptitude_links.json not found at %s", _DATA_FILE)
        return []
    with _DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


@tool
def get_aptitude_links(category: str) -> list[dict[str, Any]]:
    """
    Retrieve curated aptitude and reasoning practice links for a specific category.

    Use this to find practice resources for categories like
    'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'.

    Args:
        category: The aptitude category name (case-insensitive, partial match supported).

    Returns:
        List of link dicts with 'category', 'difficulty', 'platform', 'url', 'description'.
    """
    links = _load_aptitude_links()
    if not category:
        return links
    cat_lower = category.lower()
    matched = [
        link for link in links
        if cat_lower in link.get("category", "").lower()
    ]
    return matched if matched else links


@tool
def get_all_aptitude_links() -> list[dict[str, Any]]:
    """
    Retrieve all available aptitude and reasoning resource links.

    Returns:
        Complete list of all aptitude resource links.
    """
    return _load_aptitude_links()
