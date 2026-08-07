"""
app/tools/web_scraper.py
─────────────────────────
Web search tool powered by Tavily via LangChain.

Updated for tavily-python 0.7.x and langchain-community 0.3.x.
TavilySearchResults is still the standard LangChain tool but the
underlying tavily-python client API has changed.
"""

from __future__ import annotations

import logging
import os
from typing import Any

# pyrefly: ignore [missing-import]
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool

from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_tavily_tool(max_results: int = 5) -> TavilySearchResults:
    """Build a TavilySearchResults LangChain tool with the API key from settings."""
    settings = get_settings()
    os.environ["TAVILY_API_KEY"] = settings.tavily_api_key

    return TavilySearchResults(
        max_results=max_results,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=False,
        include_images=False,
    )


# ── Module-level singleton ────────────────────────────────────
_tavily: TavilySearchResults | None = None


def get_tavily() -> TavilySearchResults:
    """Return (or lazily create) the singleton Tavily tool."""
    global _tavily
    if _tavily is None:
        _tavily = _get_tavily_tool()
    return _tavily


# ─────────────────────────────────────────────────────────────
# LangChain @tool decorated functions
# ─────────────────────────────────────────────────────────────

@tool
def search_company_placement_info(company_name: str) -> list[dict[str, Any]]:
    """
    Search the web for placement interview information about a tech company.
    Returns structured results including interview rounds, common topics,
    and tips from real candidates.

    Args:
        company_name: Name of the target company (e.g., 'Google', 'Amazon').
    """
    query = (
        f"{company_name} software engineer placement interview process "
        f"rounds questions topics 2024 tips"
    )
    logger.info("[Tavily] Searching company intel: %s", company_name)
    try:
        results = get_tavily().invoke({"query": query})
        return results if isinstance(results, list) else []
    except Exception as exc:
        logger.warning("[Tavily] Search failed for %s: %s", company_name, exc)
        return []


@tool
def search_topic_resources(topic: str) -> list[dict[str, Any]]:
    """
    Search the web for the best learning resources for a DSA or CS topic.

    Args:
        topic: The topic to search for (e.g., 'Dynamic Programming', 'System Design').
    """
    query = f"best resources tutorial practice problems {topic} placement interview preparation"
    logger.info("[Tavily] Searching topic resources: %s", topic)
    try:
        results = get_tavily().invoke({"query": query})
        return results if isinstance(results, list) else []
    except Exception as exc:
        logger.warning("[Tavily] Search failed for topic %s: %s", topic, exc)
        return []


@tool
def search_aptitude_resources(category: str) -> list[dict[str, Any]]:
    """
    Search the web for aptitude and reasoning practice resources.

    Args:
        category: Aptitude category (e.g., 'Quantitative Aptitude', 'Logical Reasoning').
    """
    query = f"{category} practice questions placement aptitude test preparation"
    logger.info("[Tavily] Searching aptitude resources: %s", category)
    try:
        results = get_tavily().invoke({"query": query})
        return results if isinstance(results, list) else []
    except Exception as exc:
        logger.warning("[Tavily] Search failed for %s: %s", category, exc)
        return []


async def company_search_async(company_name: str, n_results: int = 8) -> list[dict[str, Any]]:
    """Async wrapper for company placement search used in LangGraph nodes."""
    import asyncio
    tavily = _get_tavily_tool(max_results=n_results)
    query = (
        f"{company_name} placement interview process rounds questions experience 2024"
    )
    logger.info("[Tavily async] Searching: %s", query)
    try:
        results = await asyncio.to_thread(tavily.invoke, {"query": query})
        return results if isinstance(results, list) else []
    except Exception as exc:
        logger.warning("[Tavily async] Failed: %s", exc)
        return []
