"""
app/chains/notification_parser_chain.py
─────────────────────────────────────────
Gemini-powered placement notification parser chain.

Architecture:
    notification_prompt | ChatGoogleGenerativeAI | JsonOutputParser

This chain is completely separate from the main OpenAI pipeline.
It takes raw notification text and returns structured JSON that feeds
directly into the LangGraph agent's initial state.

Output schema:
{
  "company": "SurveySparrow",
  "target_role": "Full Stack Developer Intern",
  "interview_date": null,          // ISO date if explicitly stated
  "deadline_date": "2026-07-08",   // registration deadline
  "preparation_duration_days": 14, // days from today to interview/deadline
  "process_rounds": [
    "Pre-Placement Talk",
    "Online Assessment",
    "Interview"
  ],
  "tech_stack": ["Node.js", "React.js", "JavaScript", "Java", "C++"],
  "stipend": "20000",              // monthly stipend if mentioned
  "location": "Chennai, Tamil Nadu",
  "eligibility": "2023-2027 Batch, 75%+",
  "ctc": "8.0 LPA"
}
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Prompt
# ─────────────────────────────────────────────────────────────

_SYSTEM = """You are a precise placement notification parser for an AI campus placement prep tool.

Extract structured details from the given placement notification text.

Return ONLY valid JSON matching this schema (no markdown, no extra text):
{{
  "company": "<company name, clean — no M/s. or legal prefixes>",
  "target_role": "<exact job title/role>",
  "interview_date": "<YYYY-MM-DD if an actual interview/drive/test date is explicitly stated, else null>",
  "deadline_date": "<YYYY-MM-DD if a registration/apply/deadline date is mentioned, else null>",
  "preparation_duration_days": <integer: days from today ({today}) to interview_date, or to deadline_date if no interview date, default 14>,
  "process_rounds": ["<round 1>", "<round 2>", ...],
  "tech_stack": ["<tech 1>", "<tech 2>", ...],
  "stipend": "<monthly stipend amount as string, e.g. '20000', or null>",
  "location": "<work location or null>",
  "eligibility": "<brief eligibility summary, e.g. '2023-2027 Batch, 75%+', or null>",
  "ctc": "<full-time CTC if mentioned, e.g. '8.0 LPA', or null>",
  "overview": [
    "<key company fact/overview point 1>",
    "<key company fact/overview point 2>",
    "<key company fact/overview point 3>",
    "<key company fact/overview point 4>",
    "<key company fact/overview point 5>"
  ],
  "tips": [
    "<strategic preparation tip 1>",
    "<strategic preparation tip 2>",
    "<strategic preparation tip 3>",
    "<strategic preparation tip 4>",
    "<strategic preparation tip 5>"
  ]
}}

Rules:
- company: strip legal prefixes like "M/s.", "M/S.", "Mr.", "Dr." — return just the brand name
- interview_date: ONLY set if the notification explicitly says "interview on", "drive date", "exam date" etc.
- deadline_date: set if the notification mentions "deadline", "last date", "registration closes", "apply by" etc.
- process_rounds: extract exactly the selection stages in order (e.g. PPT, Online Test, Technical Interview, HR)
  - Do NOT include venue names or location info as rounds
  - "Pre-Placement Talk (PPT)" → "Pre-Placement Talk"  
- tech_stack: only list actual programming languages, frameworks, tools (not soft skills)
- preparation_duration_days: calculate from today's date {today}
- overview: Provide exactly 5 concise, high-impact facts/details about the company and its domain.
- tips: Provide exactly 5 highly actionable, company-specific tips for cracking the selection process.
- Return valid JSON only. No explanation."""

_HUMAN = "Placement notification:\n\n{notification_text}"

notification_parser_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM),
    ("human", _HUMAN),
])

# ─────────────────────────────────────────────────────────────
# Chain builder
# ─────────────────────────────────────────────────────────────

_parser_chain = None


def get_notification_parser_chain():
    """Return (or lazily build) the Gemini notification parser chain."""
    global _parser_chain
    if _parser_chain is None:
        from app.utils.gemini_llm import get_gemini_llm
        llm = get_gemini_llm()
        if llm is None:
            return None
        parser = JsonOutputParser()
        _parser_chain = notification_parser_prompt | llm | parser
        logger.info("Gemini notification parser chain built.")
    return _parser_chain


# ─────────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────────

async def run_notification_parser(notification_text: str) -> dict[str, Any] | None:
    """
    Parse a placement notification using Gemini.

    Returns structured dict or None if Gemini is unavailable.
    Caller should fall back to regex parser if None is returned.
    """
    chain = get_notification_parser_chain()
    if chain is None:
        logger.info("Gemini chain unavailable — caller should use regex fallback.")
        return None

    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        logger.info("Running Gemini notification parser...")
        result = await chain.ainvoke({
            "notification_text": notification_text,
            "today": today_str,
        })
        logger.info(
            "Gemini parser succeeded: company=%s, rounds=%d",
            result.get("company"),
            len(result.get("process_rounds", [])),
        )
        return result
    except Exception as e:
        logger.warning("Gemini notification parser failed: %s", e)
        return None

# ─────────────────────────────────────────────────────────────
# Dynamic Company Intel Generation (Fallback)
# ─────────────────────────────────────────────────────────────

_COMPANY_INTEL_SYSTEM = """You are a career and placement expert.
Given a company name, generate a 5-point overview of the company and 5 strategic preparation tips for their interview process.

Return ONLY valid JSON matching this schema:
{{
  "overview": [
    "<key company fact/overview point 1>",
    "<key company fact/overview point 2>",
    "<key company fact/overview point 3>",
    "<key company fact/overview point 4>",
    "<key company fact/overview point 5>"
  ],
  "tips": [
    "<strategic preparation tip 1>",
    "<strategic preparation tip 2>",
    "<strategic preparation tip 3>",
    "<strategic preparation tip 4>",
    "<strategic preparation tip 5>"
  ]
}}
"""

_company_intel_prompt = ChatPromptTemplate.from_messages([
    ("system", _COMPANY_INTEL_SYSTEM),
    ("human", "Company: {company_name}")
])

async def generate_company_intel_with_gemini(company_name: str) -> dict[str, Any] | None:
    from app.utils.gemini_llm import get_gemini_llm
    llm = get_gemini_llm()
    if not llm:
        return None
    chain = _company_intel_prompt | llm | JsonOutputParser()
    try:
        logger.info("Generating company intel for %s with Gemini...", company_name)
        return await chain.ainvoke({"company_name": company_name})
    except Exception as e:
        logger.warning("Gemini company intel generation failed: %s", e)
        return None
