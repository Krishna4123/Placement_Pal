"""
app/graph/nodes.py
───────────────────
LangGraph node functions — wired to real LangChain chains and Tavily.

Each node receives the full GraphState and returns a partial dict that
LangGraph merges back into the state.

Phase 1 nodes:
  - interpret_message_node   → ExtractionChain (LCEL)
  - company_intel_node       → Tavily search + CompanyChain (LCEL)
  - knowledge_vault_node     → ChromaDB via LangChain retriever

Phase 2 nodes:
  - generate_recall_node     → RecallChain (LCEL) per topic
  - curriculum_plan_node     → CurriculumChain (LCEL)
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.graph.state_schema import GraphState

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Phase 1 Nodes
# ─────────────────────────────────────────────────────────────

async def interpret_message_node(state: GraphState) -> dict[str, Any]:
    """
    Node: interpret_message
    ───────────────────────
    Runs the ExtractionChain (LCEL) on the raw user_message and
    extracts structured placement intent.

    Output keys: interpreted_intent
    """
    from app.chains.extraction_chain import run_extraction

    session_id = state.get("session_id", "?")
    user_message = state.get("user_message", "")
    logger.info("[Node] interpret_message | session=%s", session_id)

    if not user_message:
        logger.warning("[Node] interpret_message: empty user_message, skipping.")
        return {"interpreted_intent": None}

    try:
        intent = await run_extraction(user_message)

        # Sync back extracted fields into top-level state for downstream nodes
        return {
            "interpreted_intent": intent,
            "target_companies": intent.get("target_companies", state.get("target_companies", [])),
            "target_roles": intent.get("target_roles", state.get("target_roles", [])),
            "preparation_duration_days": intent.get(
                "preparation_duration_days",
                state.get("preparation_duration_days", 30),
            ),
        }
    except Exception as exc:
        logger.exception("[Node] interpret_message failed: %s", exc)
        return {
            "interpreted_intent": None,
            "errors": state.get("errors", []) + [f"interpret_message: {exc}"],
        }


async def company_intel_node(state: GraphState) -> dict[str, Any]:
    """
    Node: company_intel  (runs in parallel with knowledge_vault_node)
    ──────────────────────────────────────────────────────────────────
    1. Uses Tavily to search for each target company.
    2. Passes results through CompanyChain (LCEL) to produce a profile.

    Output keys: company_intel
    """
    from app.tools.web_scraper import company_search_async
    from app.chains.company_chain import run_company_summary

    session_id = state.get("session_id", "?")
    companies = state.get("target_companies", [])
    logger.info("[Node] company_intel | session=%s | companies=%s", session_id, companies)

    if not companies:
        logger.info("[Node] company_intel: no target companies, skipping.")
        return {"company_intel": {}}

    results: dict[str, Any] = {}
    # Process each company concurrently
    async def _fetch_one(company: str) -> tuple[str, Any]:
        try:
            raw = await asyncio.to_thread(
                lambda: __import__("app.tools.web_scraper", fromlist=["company_search_async"])
            )
            # Use sync Tavily call wrapped in thread executor
            from app.tools.web_scraper import get_tavily
            search_results = await asyncio.to_thread(
                get_tavily().invoke,
                f"{company} software engineer placement interview process rounds 2024"
            )
            profile = await run_company_summary(company, search_results)
            return company, profile
        except Exception as exc:
            logger.warning("[Node] company_intel: failed for %s: %s", company, exc)
            return company, {"error": str(exc), "company_name": company}

    tasks = [_fetch_one(c) for c in companies[:3]]   # Cap at 3 companies
    pairs = await asyncio.gather(*tasks, return_exceptions=False)

    for company, profile in pairs:
        results[company] = profile

    return {"company_intel": results}


async def knowledge_vault_node(state: GraphState) -> dict[str, Any]:
    """
    Node: knowledge_vault  (runs in parallel with company_intel_node)
    ──────────────────────────────────────────────────────────────────
    Queries ChromaDB via LangChain's semantic retriever to surface
    relevant study materials from the student's vault.

    Output keys: vault_context
    """
    from app.database.chroma import query_documents

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    companies = state.get("target_companies", [])
    roles = state.get("target_roles", [])

    logger.info("[Node] knowledge_vault | session=%s", session_id)

    # Build a rich query from the interpreted intent
    query_parts = []
    if companies:
        query_parts.append(f"placement preparation for {', '.join(companies)}")
    if roles:
        query_parts.append(f"{', '.join(roles)} interview topics")
    for gap in intent.get("skill_gaps", []):
        query_parts.append(gap)

    query = " ".join(query_parts) if query_parts else "technical interview preparation"

    try:
        results = await asyncio.to_thread(query_documents, query, n_results=8)
        logger.info("[Node] knowledge_vault: retrieved %d docs", len(results))
        return {"vault_context": results}
    except Exception as exc:
        logger.warning("[Node] knowledge_vault failed: %s", exc)
        return {
            "vault_context": [],
            "errors": state.get("errors", []) + [f"knowledge_vault: {exc}"],
        }


# ─────────────────────────────────────────────────────────────
# Phase 2 Nodes
# ─────────────────────────────────────────────────────────────

async def generate_recall_node(state: GraphState) -> dict[str, Any]:
    """
    Node: generate_recall
    ──────────────────────
    Runs RecallChain (LCEL) for each key topic derived from the
    interpreted intent and company intel.

    Output keys: recall_questions
    """
    from app.chains.recall_chain import run_recall

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    vault_context = state.get("vault_context") or []
    company_intel = state.get("company_intel") or {}

    logger.info("[Node] generate_recall | session=%s", session_id)

    # Derive topics from company_intel common_topics + skill_gaps
    topics: set[str] = set()
    for profile in company_intel.values():
        if isinstance(profile, dict):
            topics.update(profile.get("common_topics", []))
    topics.update(intent.get("skill_gaps", []))

    # Default topics if nothing was found
    if not topics:
        topics = {"Arrays", "Dynamic Programming", "System Design", "OOPS"}

    # Format vault context as a single string
    context_text = "\n".join(
        r.get("content", "") for r in vault_context[:4]
    )

    # Run recall chain for each topic concurrently (cap at 6 topics)
    topic_list = list(topics)[:6]
    async def _recall_one(topic: str) -> tuple[str, list]:
        try:
            qs = await run_recall(topic, context=context_text, n_questions=8)
            return topic, qs
        except Exception as exc:
            logger.warning("[Node] generate_recall: failed for %s: %s", topic, exc)
            return topic, []

    pairs = await asyncio.gather(*[_recall_one(t) for t in topic_list])
    recall_questions = [
        {"topic": topic, "questions": questions}
        for topic, questions in pairs
        if questions
    ]

    logger.info("[Node] generate_recall: generated recall for %d topics", len(recall_questions))
    return {"recall_questions": recall_questions}


async def curriculum_plan_node(state: GraphState) -> dict[str, Any]:
    """
    Node: curriculum_plan
    ──────────────────────
    Runs CurriculumChain (LCEL) with full context from Phase 1
    to produce a personalised day-by-day study plan.

    Output keys: curriculum
    """
    from app.chains.curriculum_chain import run_curriculum

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    companies = state.get("target_companies", [])
    roles = state.get("target_roles", [])
    duration_days = state.get("preparation_duration_days", 30)
    company_intel = state.get("company_intel") or {}
    vault_context = state.get("vault_context") or []

    logger.info("[Node] curriculum_plan | session=%s | days=%d", session_id, duration_days)

    try:
        curriculum = await run_curriculum(
            companies=companies,
            roles=roles,
            duration_days=duration_days,
            skill_gaps=intent.get("skill_gaps", []),
            current_skills=intent.get("current_skills", []),
            company_intel=company_intel,
            vault_context=vault_context,
            study_hours_per_day=intent.get("preferences", {}).get("study_hours_per_day", 4.0),
        )
        logger.info("[Node] curriculum_plan: curriculum generated successfully.")
        return {"curriculum": curriculum}
    except Exception as exc:
        logger.exception("[Node] curriculum_plan failed: %s", exc)
        return {
            "curriculum": None,
            "errors": state.get("errors", []) + [f"curriculum_plan: {exc}"],
        }
