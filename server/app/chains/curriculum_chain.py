"""
app/chains/curriculum_chain.py
────────────────────────────────
LangChain Curriculum Chain (LCEL).

Architecture:
    curriculum_prompt | llm | JsonOutputParser

Produces a structured day-by-day study plan tailored to the student's
target companies, timeline, and skill gaps.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import Runnable

from app.utils.llm import get_creative_llm
from app.utils.prompts import curriculum_prompt

logger = logging.getLogger(__name__)


def build_curriculum_chain() -> Runnable:
    """
    Build the curriculum LCEL chain.

    Chain:  curriculum_prompt | ChatOpenAI | JsonOutputParser

    Uses temperature=0.3 to produce creative yet consistent plans.
    """
    llm = get_creative_llm()
    parser = JsonOutputParser()

    chain = curriculum_prompt | llm | parser
    logger.info("Curriculum chain built successfully.")
    return chain


# ── Singleton ─────────────────────────────────────────────────
_curriculum_chain: Runnable | None = None


def get_curriculum_chain() -> Runnable:
    """Return (or lazily build) the singleton curriculum chain."""
    global _curriculum_chain
    if _curriculum_chain is None:
        _curriculum_chain = build_curriculum_chain()
    return _curriculum_chain


async def run_curriculum(
    companies: list[str],
    roles: list[str],
    duration_days: int,
    start_day: int = 1,
    end_day: int = 5,
    skill_gaps: list[str] | None = None,
    current_skills: list[str] | None = None,
    company_intel: dict[str, Any] | None = None,
    vault_context: list[dict[str, Any]] | None = None,
    recall_questions: list[dict[str, Any]] | None = None,
    study_hours_per_day: float = 4.0,
    process_rounds: list[str] | None = None,
) -> dict[str, Any]:
    """
    Generate a complete day-by-day placement curriculum.

    Args:
        companies:           List of target company names.
        roles:               List of target job roles.
        duration_days:       Total preparation days.
        skill_gaps:          Topics the student is weak in.
        current_skills:      Topics the student already knows well.
        company_intel:       Structured company data from CompanyChain.
        vault_context:       Relevant docs & manual topics retrieved from Knowledge Vault.
        recall_questions:    Practice recall questions output from Recall Node.
        study_hours_per_day: Available study time per day.
        process_rounds:      List of selection stages to prepare for.

    Returns:
        Curriculum dict with 'total_days', 'phases', 'days' etc.
    """
    chain = get_curriculum_chain()
    logger.info(
        "Running curriculum chain: %d days, companies=%s",
        duration_days, companies,
    )

    # Format company intel string
    intel_parts = []
    if company_intel:
        for cname, cdata in company_intel.items():
            if isinstance(cdata, dict):
                ov = " ".join(cdata.get("overview", []))
                tech = ", ".join(cdata.get("tech_stack", []))
                tips = "; ".join(cdata.get("tips", []))
                intel_parts.append(f"Company {cname}: Overview: {ov} | Tech Stack: {tech} | Tips: {tips}")
    company_intel_str = "\n".join(intel_parts) if intel_parts else "No specific company intel provided."

    # Format vault context string
    v_parts = []
    if vault_context:
        for item in vault_context[:6]:
            if isinstance(item, dict):
                content = item.get("content") or item.get("document") or item.get("name") or ""
                src = item.get("metadata", {}).get("filename", "Vault")
                v_parts.append(f"[{src}] {content[:200]}")
    vault_context_str = "\n".join(v_parts) if v_parts else "No knowledge vault documents/topics provided."

    # Format recall questions string
    r_parts = []
    if recall_questions:
        for item in recall_questions:
            topic = item.get("topic", "General")
            qs = item.get("questions", [])
            q_titles = [q.get("question", str(q)) if isinstance(q, dict) else str(q) for q in qs[:3]]
            r_parts.append(f"Topic '{topic}' questions: {'; '.join(q_titles)}")
    recall_questions_str = "\n".join(r_parts) if r_parts else "No recall questions generated."

    result = await chain.ainvoke({
        "companies": ", ".join(companies) if companies else "General Tech",
        "roles": ", ".join(roles) if roles else "Software Engineer",
        "duration_days": duration_days,
        "start_day": start_day,
        "end_day": end_day,
        "study_hours_per_day": study_hours_per_day,
        "skill_gaps": ", ".join(skill_gaps or []) or "None specified",
        "current_skills": ", ".join(current_skills or []) or "None specified",
        "process_rounds": ", ".join(process_rounds or []) if process_rounds else "None specified",
        "company_intel_str": company_intel_str,
        "vault_context_str": vault_context_str,
        "recall_questions_str": recall_questions_str,
    })
    return result

