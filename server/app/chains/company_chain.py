"""
app/chains/company_chain.py
────────────────────────────
LangChain Company Summary Chain (LCEL).

Architecture:
    company_summary_prompt | llm | JsonOutputParser

Takes raw Tavily search results about a company and produces a structured
placement profile using the institution-provided LLM.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import Runnable

from app.utils.llm import get_fast_llm
from app.utils.prompts import company_summary_prompt

logger = logging.getLogger(__name__)


def build_company_chain() -> Runnable:
    """
    Build the company summary LCEL chain.

    Chain:  company_summary_prompt | ChatOpenAI | JsonOutputParser
    """
    llm = get_fast_llm()
    parser = JsonOutputParser()

    chain = company_summary_prompt | llm | parser
    logger.info("Company chain built successfully.")
    return chain


# ── Singleton ─────────────────────────────────────────────────
_company_chain: Runnable | None = None


def get_company_chain() -> Runnable:
    """Return (or lazily build) the singleton company chain."""
    global _company_chain
    if _company_chain is None:
        _company_chain = build_company_chain()
    return _company_chain


async def run_company_summary(
    company_name: str,
    search_results: list[dict[str, Any]] | None = None,
    raw_text: str = "",
) -> dict[str, Any]:
    """
    Summarise a company's placement profile.

    Args:
        company_name:   Name of the company.
        search_results: Raw Tavily results (list of dicts with 'content').
        raw_text:       Alternative raw text if search_results not provided.

    Returns:
        Structured company profile dict.
    """
    chain = get_company_chain()

    # Truncate search results aggressively to reduce LLM token load
    if search_results:
        formatted = "\n\n".join(
            f"[{i+1}] {r.get('url', '')}\n{r.get('content', '')[:300]}"
            for i, r in enumerate(search_results[:3])
        )
    else:
        formatted = raw_text[:900] if raw_text else "No search results available."

    logger.info("Running company chain for: %s", company_name)
    result = await chain.ainvoke({
        "company_name": company_name,
        "search_results": formatted,
    })
    return result
