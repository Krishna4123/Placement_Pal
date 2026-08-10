"""
app/chains/recall_chain.py
───────────────────────────
LangChain Recall Chain (LCEL).

Architecture:
    recall_prompt | llm | JsonOutputParser

Generates spaced-repetition practice questions for a given topic using
the institution-provided LLM endpoint.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import Runnable

from app.utils.llm import get_creative_llm
from app.utils.prompts import recall_prompt

logger = logging.getLogger(__name__)

# Default number of questions to generate per topic (keep small for faster LLM response)
DEFAULT_N_QUESTIONS = 3


def build_recall_chain() -> Runnable:
    """
    Build the recall LCEL chain.

    Chain:  recall_prompt | ChatOpenAI | JsonOutputParser

    Uses a slightly higher temperature (0.3) to produce varied questions.
    """
    llm = get_creative_llm()
    parser = JsonOutputParser()

    chain = recall_prompt | llm | parser
    logger.info("Recall chain built successfully.")
    return chain


# ── Singleton ─────────────────────────────────────────────────
_recall_chain: Runnable | None = None


def get_recall_chain() -> Runnable:
    """Return (or lazily build) the singleton recall chain."""
    global _recall_chain
    if _recall_chain is None:
        _recall_chain = build_recall_chain()
    return _recall_chain


async def run_recall(
    topic: str,
    context: str = "",
    company_info: str = "",
    n_questions: int = DEFAULT_N_QUESTIONS,
) -> list[dict[str, Any]]:
    """
    Generate recall questions for a topic.

    Args:
        topic:        Topic name (e.g., 'Dynamic Programming').
        context:      Optional extra context from vault retrieval (docs & topics).
        company_info: Overview, tech stack, and interview tips for the target company.
        n_questions:  Number of questions to generate.

    Returns:
        List of question dicts with keys: question, answer, difficulty, topic, question_type.
    """
    chain = get_recall_chain()
    logger.info("Running recall chain for topic: %s", topic)
    result = await chain.ainvoke({
        "topic": topic,
        "company_info": company_info or "General software engineering interview.",
        "context": context or "No additional vault context provided.",
        "n_questions": n_questions,
    })
    # Ensure we always return a list
    return result if isinstance(result, list) else [result]

