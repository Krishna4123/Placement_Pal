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


# ── Fallback Helpers ──────────────────────────────────────────

import re
from datetime import datetime

def _calc_days_from_date(date_str: str | None) -> int | None:
    if not date_str:
        return None
    try:
        from dateutil import parser
        dt = parser.parse(date_str, fuzzy=True)
        today = datetime.now()
        diff = (dt.date() - today.date()).days
        return diff if diff > 0 else 1
    except Exception:
        return None

def _extract_date_from_text(text: str) -> str | None:
    if not text:
        return None
    m = re.search(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}?\b', text, re.IGNORECASE)
    if m:
        return m.group(0)
    m2 = re.search(r'\b\d{4}-\d{2}-\d{2}\b', text)
    if m2:
        return m2.group(0)
    m3 = re.search(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', text)
    if m3:
        return m3.group(0)
    return None

def _fallback_intent(user_message: str, companies: list[str], roles: list[str]) -> dict[str, Any]:
    comp = companies or ["Google"]
    r = roles or ["Software Development Engineer"]
    rounds = []
    if user_message and ("round" in user_message.lower() or "process" in user_message.lower() or "test" in user_message.lower()):
        lines = [line.strip() for line in user_message.split("\n") if line.strip()]
        for line in lines:
            if any(w in line.lower() for w in ["round", "test", "interview", "assessment", "screening"]):
                rounds.append(line)

    extracted_date = _extract_date_from_text(user_message)
    rem_days = _calc_days_from_date(extracted_date) or 5

    return {
        "target_companies": comp,
        "target_roles": r,
        "interview_date": extracted_date,
        "preparation_duration_days": rem_days,
        "process_rounds": rounds,
        "skill_gaps": ["Dynamic Programming", "System Design", "Operating Systems"],
        "current_skills": ["Data Structures", "Arrays", "SQL"],
        "preferences": {"study_hours_per_day": 4.0},
    }

def _fallback_curriculum(companies: list[str], roles: list[str], duration_days: int) -> dict[str, Any]:
    comp_str = ", ".join(companies) if companies else "Target Company"
    role_str = ", ".join(roles) if roles else "SDE"
    days = []
    num_days = min(duration_days if duration_days > 0 else 14, 14)

    task_templates = [
        [
            {"task_id": "d1_1", "title": f"Arrays & Two Pointers — {comp_str} Past Questions", "type": "coding", "difficulty": "Easy", "estimated_minutes": 120, "status": "pending"},
            {"task_id": "d1_2", "title": "OS: Process Concepts, PCB & Threads", "type": "core", "difficulty": "Medium", "estimated_minutes": 90, "status": "pending"},
            {"task_id": "d1_3", "title": "Aptitude: Percentages & Ratio Analysis", "type": "aptitude", "difficulty": "Easy", "estimated_minutes": 45, "status": "pending"},
        ],
        [
            {"task_id": "d2_1", "title": "Linked Lists — Reverse, Fast-Slow Pointers", "type": "coding", "difficulty": "Medium", "estimated_minutes": 120, "status": "pending"},
            {"task_id": "d2_2", "title": "DBMS: Normalization (1NF to BCNF)", "type": "core", "difficulty": "Medium", "estimated_minutes": 90, "status": "pending"},
            {"task_id": "d2_3", "title": "Aptitude: Time, Work & Pipes", "type": "aptitude", "difficulty": "Easy", "estimated_minutes": 45, "status": "pending"},
        ],
        [
            {"task_id": "d3_1", "title": "Binary Search & Sliding Window Problems", "type": "coding", "difficulty": "Medium", "estimated_minutes": 120, "status": "pending"},
            {"task_id": "d3_2", "title": "Computer Networks: OSI Model & TCP/IP", "type": "core", "difficulty": "Medium", "estimated_minutes": 60, "status": "pending"},
            {"task_id": "d3_3", "title": f"Mock Technical Interview — {role_str} Focus", "type": "coding", "difficulty": "Hard", "estimated_minutes": 90, "status": "pending"},
        ]
    ]

    for i in range(1, num_days + 1):
        tpl = task_templates[(i - 1) % len(task_templates)]
        day_tasks = []
        for tidx, t in enumerate(tpl):
            day_tasks.append({
                "task_id": f"d{i}_{tidx+1}",
                "title": t["title"],
                "type": t["type"],
                "difficulty": t["difficulty"],
                "estimated_minutes": t["estimated_minutes"],
                "status": "pending"
            })
        days.append({
            "day": i,
            "title": f"Day {i} — {role_str} Focus",
            "focus_topics": ["DSA", "Core CS", "Aptitude"],
            "tasks": day_tasks
        })

    return {
        "title": f"{comp_str} {role_str} Master Curriculum",
        "total_days": num_days,
        "days": days
    }

def _fallback_recall(topics: list[str]) -> list[dict[str, Any]]:
    default_topics = topics or ["Dynamic Programming", "System Design", "Operating Systems", "Arrays"]
    result = []
    for t in default_topics:
        result.append({
            "topic": t,
            "questions": [
                f"What are the key trade-offs in {t}?",
                f"Explain how you would optimize a time/space bottleneck in {t}.",
                f"What is a standard interview problem involving {t} and its optimal solution?"
            ]
        })
    return result

# ─────────────────────────────────────────────────────────────
# Phase 1 Nodes
# ─────────────────────────────────────────────────────────────

async def interpret_message_node(state: GraphState) -> dict[str, Any]:
    from app.chains.notification_parser_chain import run_notification_parser
    from app.api.parse import _regex_parse

    session_id = state.get("session_id", "?")
    user_message = state.get("user_message", "")
    logger.info("[Node] interpret_message | session=%s", session_id)

    # ── 1. Obtain parsed notification dictionary ─────────────────────────────
    parsed = state.get("parsed_notification")
    if not parsed and user_message:
        logger.info("[Node] interpret_message | Running parsing on-the-fly.")
        try:
            parsed = await run_notification_parser(user_message)
        except Exception as e:
            logger.warning("[Node] interpret_message | Gemini parsing failed: %s", e)
        if not parsed:
            parsed = _regex_parse(user_message)

    # If no message and no pre-parsed data, return a generic fallback
    if not parsed:
        fallback = _fallback_intent(user_message, state.get("target_companies", []), state.get("target_roles", []))
        return {
            "interpreted_intent": fallback,
            "target_companies": fallback["target_companies"],
            "target_roles": fallback["target_roles"],
            "preparation_duration_days": fallback["preparation_duration_days"],
        }

    # ── 2. Map parsed dictionary to GraphState fields ────────────────────────
    comp = parsed.get("company")
    role = parsed.get("target_role")
    
    intent = {
        "target_companies": [comp] if comp else [],
        "target_roles": [role] if role else [],
        "interview_date": parsed.get("interview_date") or parsed.get("deadline_date"),
        "preparation_duration_days": parsed.get("preparation_duration_days", 5),
        "process_rounds": parsed.get("process_rounds", []),
        "skill_gaps": [],
        "current_skills": parsed.get("tech_stack", []),
        "preferences": {"study_hours_per_day": 4.0, "focus_areas": ["DSA", "System Design"]},
    }

    # Compile instant company intel boxes for the debugger and frontend
    overview = parsed.get("overview")
    tips = parsed.get("tips")
    
    if comp and (not overview or not tips):
        from app.chains.notification_parser_chain import generate_company_intel_with_gemini
        logger.info("[Node] interpret_message | Generating dynamic company intel for %s", comp)
        gen_intel = await generate_company_intel_with_gemini(comp)
        if gen_intel:
            overview = gen_intel.get("overview") or overview
            tips = gen_intel.get("tips") or tips

    overview = overview or [f"{comp} is a leading technology company." if comp else "Target company profile."]
    tips = tips or [
        "Focus on fundamental concepts and system design.",
        "Practice coding problems related to their tech stack.",
        "Be ready to walkthrough your projects and explain your role.",
    ]
    
    company_intel = {}
    if comp:
        company_intel[comp] = {
            "company_name": comp,
            "overview": overview,
            "tech_stack": parsed.get("tech_stack", []),
            "common_topics": parsed.get("tech_stack", []),
            "past_interview_experiences": [],
            "tips": tips,
        }

    return {
        "interpreted_intent": intent,
        "target_companies": intent["target_companies"],
        "target_roles": intent["target_roles"],
        "preparation_duration_days": intent["preparation_duration_days"],
        "company_intel": company_intel,
    }




async def company_intel_node(state: GraphState) -> dict[str, Any]:
    session_id = state.get("session_id", "?")
    companies = state.get("target_companies", [])
    logger.info("[Node] company_intel | session=%s | companies=%s", session_id, companies)

    # Re-use company_intel if already generated by interpret_message
    existing = state.get("company_intel")
    if existing:
        logger.info("[Node] company_intel | Reusing company_intel generated by parser node.")
        return {"company_intel": existing}

    # Fallback default if not present (pure local fallback, no API keys required)
    results: dict[str, Any] = {}
    for comp in companies:
        results[comp] = {
            "company_name": comp,
            "overview": [
                f"{comp} is a leading technology company in its domain.",
                "Operates on a high-scale, modern software architecture.",
                "Focuses on delivering customer-centric software solutions.",
                "Known for hiring passionate, technical engineers.",
                "Provides great learning opportunities for career growth."
            ],
            "tech_stack": [],
            "common_topics": ["DSA", "System Design", "OS", "DBMS"],
            "past_interview_experiences": [],
            "tips": [
                "Practice core computer science fundamentals (DSA, DBMS, OS).",
                "Be thoroughly prepared to explain any projects on your resume.",
                "Understand the company's product domain and key features.",
                "Optimize code for both time and space complexity in tests.",
                "Prepare clear answers for standard behavioral and HR questions."
            ]
        }

    return {"company_intel": results}


async def knowledge_vault_node(state: GraphState) -> dict[str, Any]:
    from app.database.chroma import query_documents
    from app.services.vault_service import VaultService

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    companies = state.get("target_companies", [])
    roles = state.get("target_roles", [])
    company_intel = state.get("company_intel") or {}

    logger.info("[Node] knowledge_vault | session=%s", session_id)

    query_parts = []
    if companies:
        query_parts.append(f"placement preparation for {', '.join(companies)}")
    if roles:
        query_parts.append(f"{', '.join(roles)} interview topics")
    for gap in intent.get("skill_gaps", []):
        query_parts.append(gap)
    for cdata in company_intel.values():
        if isinstance(cdata, dict):
            query_parts.extend(cdata.get("tech_stack", []))

    query = " ".join(query_parts) if query_parts else "technical interview preparation"

    vault_results: list[dict[str, Any]] = []

    # 1. Fetch document chunks from ChromaDB
    try:
        doc_results = await asyncio.to_thread(query_documents, query, n_results=8)
        logger.info("[Node] knowledge_vault: retrieved %d docs from ChromaDB", len(doc_results))
        vault_results.extend(doc_results)
    except Exception as exc:
        logger.warning("[Node] knowledge_vault ChromaDB query failed: %s", exc)

    # 2. Fetch manual topics from MongoDB
    try:
        vault_service = VaultService()
        manual_topics = await vault_service.list_topics()
        logger.info("[Node] knowledge_vault: retrieved %d manual topics from MongoDB", len(manual_topics))
        for t in manual_topics:
            vault_results.append({
                "content": f"Manual Topic: {t.get('name')} (Category: {t.get('category')}, Status/Difficulty: {t.get('difficulty', 'medium')})",
                "metadata": {"source": "MongoDB Topics", "name": t.get("name"), "category": t.get("category")},
                "score": 1.0
            })
    except Exception as exc:
        logger.warning("[Node] knowledge_vault MongoDB topic fetch failed: %s", exc)

    return {"vault_context": vault_results}


# ─────────────────────────────────────────────────────────────
# Phase 2 Nodes
# ─────────────────────────────────────────────────────────────

async def generate_recall_node(state: GraphState) -> dict[str, Any]:
    from app.chains.recall_chain import run_recall

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    vault_context = state.get("vault_context") or []
    company_intel = state.get("company_intel") or {}

    logger.info("[Node] generate_recall | session=%s", session_id)

    # Extract company info string for prompt context
    c_parts = []
    topics: set[str] = set()

    for comp, profile in company_intel.items():
        if isinstance(profile, dict):
            ov = " ".join(profile.get("overview", []))
            tech = ", ".join(profile.get("tech_stack", []))
            c_parts.append(f"Company {comp}: Overview: {ov} | Tech Stack: {tech}")
            topics.update(profile.get("common_topics", []))
            topics.update(profile.get("tech_stack", []))

    company_info_str = "\n".join(c_parts) if c_parts else "Target company software engineering role."

    # Incorporate skill gaps and vault manual topics into topic set
    topics.update(intent.get("skill_gaps", []))
    for v in vault_context:
        if isinstance(v, dict) and "metadata" in v and "name" in v["metadata"]:
            topics.add(v["metadata"]["name"])

    if not topics:
        topics = {"Arrays", "Dynamic Programming", "System Design", "OOPS"}

    context_text = "\n".join(
        r.get("content", "") if isinstance(r, dict) else str(r)
        for r in vault_context[:6]
    )

    topic_list = list(topics)[:6]
    async def _recall_one(topic: str) -> tuple[str, list]:
        try:
            qs = await run_recall(topic, context=context_text, company_info=company_info_str, n_questions=3)
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

    if not recall_questions:
        logger.info("[Node] generate_recall: using fallback recall questions")
        recall_questions = _fallback_recall(topic_list)

    logger.info("[Node] generate_recall: generated recall for %d topics", len(recall_questions))
    return {"recall_questions": recall_questions}


async def curriculum_plan_node(state: GraphState) -> dict[str, Any]:
    from app.chains.curriculum_chain import run_curriculum

    session_id = state.get("session_id", "?")
    intent = state.get("interpreted_intent") or {}
    companies = state.get("target_companies", [])
    roles = state.get("target_roles", [])
    duration_days = state.get("preparation_duration_days", 5)
    company_intel = state.get("company_intel") or {}
    vault_context = state.get("vault_context") or []
    recall_questions = state.get("recall_questions") or []

    generate_next = state.get("generate_next", False)
    existing_curriculum = state.get("curriculum") or {}
    existing_days = existing_curriculum.get("days", [])

    if generate_next and existing_days:
        start_day = existing_days[-1].get("day", len(existing_days)) + 1
    else:
        start_day = 1
        existing_days = []

    remaining_days = duration_days - start_day + 1
    if remaining_days <= 0:
        logger.info("[Node] curriculum_plan: no more days to generate.")
        return {"curriculum": existing_curriculum}

    chunk_size = state.get("chunk_size", 5)
    days_to_generate = min(remaining_days, chunk_size)
    end_day = start_day + days_to_generate - 1

    logger.info("[Node] curriculum_plan | session=%s | total_days=%d | generating %d days (%d to %d)", session_id, duration_days, days_to_generate, start_day, end_day)

    try:
        curriculum = await run_curriculum(
            companies=companies,
            roles=roles,
            duration_days=days_to_generate,
            start_day=start_day,
            end_day=end_day,
            skill_gaps=intent.get("skill_gaps", []),
            current_skills=intent.get("current_skills", []),
            company_intel=company_intel,
            vault_context=vault_context,
            recall_questions=recall_questions,
            study_hours_per_day=intent.get("preferences", {}).get("study_hours_per_day", 4.0),
            process_rounds=intent.get("process_rounds", []),
        )
        
        if generate_next and existing_days:
            new_days = curriculum.get("days", [])
            curriculum["days"] = existing_days + new_days
            curriculum["total_days"] = duration_days

        logger.info("[Node] curriculum_plan: curriculum generated successfully.")
        return {"curriculum": curriculum}
    except Exception as exc:
        logger.warning("[Node] curriculum_plan failed (using fallback curriculum): %s", exc)
        fallback = _fallback_curriculum(companies, roles, duration_days)
        return {
            "curriculum": fallback,
            "errors": state.get("errors", []) + [f"curriculum_plan: {exc}"],
        }

