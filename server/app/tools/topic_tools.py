"""
app/tools/topic_tools.py
─────────────────────────
LangChain @tool functions that operate on topic data from MongoDB
and ChromaDB.

These tools are passed directly into CrewAI agents and LangGraph nodes.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def search_topics_by_name(name: str) -> list[dict[str, Any]]:
    """
    Search the MongoDB 'topics' collection by name (case-insensitive).

    Use this to check if a topic already exists in the knowledge vault
    before creating a duplicate.

    Args:
        name: Topic name or partial name to search for.

    Returns:
        List of matching topic dicts.
    """
    # Import here to avoid circular imports at module load time
    from app.database.collections import get_topics_collection
    import asyncio

    async def _query():
        col = get_topics_collection()
        cursor = col.find(
            {"name": {"$regex": name, "$options": "i"}},
            {"_id": 1, "name": 1, "category": 1, "tags": 1, "difficulty": 1},
        )
        return await cursor.to_list(length=20)

    try:
        return asyncio.get_event_loop().run_until_complete(_query())
    except Exception as exc:
        logger.warning("search_topics_by_name failed: %s", exc)
        return []


@tool
def get_topic_resources(topic_name: str) -> list[str]:
    """
    Return the list of resource URLs stored for a given topic name.

    Args:
        topic_name: Exact or partial topic name.

    Returns:
        List of resource URL strings for the matched topic.
    """
    from app.database.collections import get_topics_collection
    import asyncio

    async def _query():
        col = get_topics_collection()
        doc = await col.find_one(
            {"name": {"$regex": topic_name, "$options": "i"}},
            {"resources": 1},
        )
        return doc.get("resources", []) if doc else []

    try:
        return asyncio.get_event_loop().run_until_complete(_query())
    except Exception as exc:
        logger.warning("get_topic_resources failed: %s", exc)
        return []


@tool
def search_topics_by_tags(tags: str) -> list[dict[str, Any]]:
    """
    Return topics that have at least one of the given tags.

    Args:
        tags: Comma-separated list of tags to search for (e.g., "DSA,graphs,trees").

    Returns:
        List of matching topic dicts.
    """
    from app.database.collections import get_topics_collection
    import asyncio

    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    async def _query():
        col = get_topics_collection()
        cursor = col.find(
            {"tags": {"$in": tag_list}},
            {"_id": 1, "name": 1, "category": 1, "tags": 1},
        )
        return await cursor.to_list(length=30)

    try:
        return asyncio.get_event_loop().run_until_complete(_query())
    except Exception as exc:
        logger.warning("search_topics_by_tags failed: %s", exc)
        return []
