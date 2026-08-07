"""
app/chains/extraction_chain.py
────────────────────────────────
LangChain Extraction Chain (LCEL).

Architecture:
    extraction_prompt | llm | JsonOutputParser

Extracts structured placement-prep intent from raw user messages using
the institution-provided LLM endpoint.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import Runnable

from app.utils.llm import get_fast_llm
from app.utils.prompts import extraction_prompt

logger = logging.getLogger(__name__)


def build_extraction_chain() -> Runnable:
    """
    Build the extraction LCEL chain.

    Chain:  extraction_prompt | ChatOpenAI | JsonOutputParser

    The JsonOutputParser handles stripping markdown fences and parsing
    the model's JSON response into a Python dict automatically.
    """
    llm = get_fast_llm()
    parser = JsonOutputParser()

    chain = extraction_prompt | llm | parser
    logger.info("Extraction chain built successfully.")
    return chain


# ── Singleton ─────────────────────────────────────────────────
_extraction_chain: Runnable | None = None


def get_extraction_chain() -> Runnable:
    """Return (or lazily build) the singleton extraction chain."""
    global _extraction_chain
    if _extraction_chain is None:
        _extraction_chain = build_extraction_chain()
    return _extraction_chain


async def run_extraction(user_message: str) -> dict[str, Any]:
    """
    Run the extraction chain on a user message.

    Args:
        user_message: Raw free-text input from the student.

    Returns:
        Structured intent dict with keys: target_companies, target_roles,
        preparation_duration_days, skill_gaps, current_skills, preferences.
    """
    chain = get_extraction_chain()
    logger.info("Running extraction chain …")
    result = await chain.ainvoke({"user_message": user_message})
    logger.info("Extraction complete: %s", result)
    return result
