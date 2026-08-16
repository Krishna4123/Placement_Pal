"""
app/api/chat.py
───────────────
Router: /chat

Multi-module integrated PlacementPal AI Assistant endpoint.
Aggregates context across all application modules:
  - Target Company Intelligence
  - Knowledge Vault (ChromaDB RAG + MongoDB topics)
  - Active Recall Guide & Weak Topics
  - Master Curriculum & Day-by-day Roadmap
  - Daily Planner Tasks & Completion Status
  - Resume ATS Evaluation & Skill Alignment
"""

from __future__ import annotations

import logging
from typing import Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, status

from app.models.response_models import APIResponse
from app.services.session_service import SessionService
from app.services.vault_service import VaultService
from app.database.chroma import query_documents
from app.utils.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

session_service = SessionService()
vault_service = VaultService()


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    session_id: str = Field(default="active_session", description="Active session ID")
    message: str = Field(..., description="User query message")
    history: list[ChatMessage] = Field(default_factory=list, description="Recent conversation history")
    current_page: str = Field(default="/dashboard", description="Current frontend page route")


PAGE_LABEL_MAP: dict[str, str] = {
    "/dashboard": "Dashboard",
    "/company": "Company Intelligence",
    "/vault": "Knowledge Vault",
    "/resume": "Resume & ATS Hub",
    "/recall": "Recall Guide",
    "/curriculum": "Curriculum Roadmap",
    "/planner": "Daily Planner",
    "/settings": "Settings",
    "/new-session": "New Prep Session",
}


@router.post(
    "",
    summary="Send a message to PlacementPal AI Assistant with full multi-module context",
    status_code=status.HTTP_200_OK,
)
async def chat_with_assistant(body: ChatRequest) -> APIResponse[dict[str, Any]]:
    """
    Synthesize complete context across all 6 core modules and generate an intelligent response using LLM.
    """
    user_query = body.message.strip()
    session_id = body.session_id or "active_session"
    current_page_label = PAGE_LABEL_MAP.get(body.current_page, "Dashboard")

    logger.info("[Chat API] session=%s | page=%s | query=%s", session_id, body.current_page, user_query[:60])

    # ── 1. Fetch Session State ──────────────────────────────────────────
    session = await session_service.get_session(session_id)
    companies = session.target_companies if session else ["Target Company"]
    roles = session.target_roles if session else ["Software Development Engineer"]
    target_comp_str = ", ".join(companies) if companies else "Target Company"
    target_role_str = ", ".join(roles) if roles else "Software Engineer"
    duration_days = session.preparation_duration_days if session else 14
    current_day = session.current_day if session else 1

    company_intel = session.company_intel if session else {}
    company_info_summary = ""
    for comp, info in company_intel.items():
        if isinstance(info, dict):
            ov = " ".join(info.get("overview", []))
            rounds = ", ".join(info.get("process_rounds", []))
            tech = ", ".join(info.get("tech_stack", []))
            company_info_summary += f"\nCompany {comp}: Overview: {ov} | Tech: {tech} | Rounds: {rounds}"

    # ── 2. Fetch Resume Evaluation & Skills ──────────────────────────────
    resume_summary = "No resume uploaded yet."
    try:
        resume_doc = await vault_service.get_resume(session_id)
        if resume_doc:
            ats_score = resume_doc.get("ats_score", "N/A")
            skills = ", ".join(resume_doc.get("extracted_skills", []))
            strengths = ", ".join(resume_doc.get("strengths", []))
            missing = ", ".join(resume_doc.get("missing_skills", []))
            suggestions = resume_doc.get("suggestions", "")
            resume_summary = (
                f"ATS Score: {ats_score}%\n"
                f"Extracted Skills: {skills}\n"
                f"Candidate Strengths: {strengths}\n"
                f"Missing Skills for {target_comp_str}: {missing}\n"
                f"Suggestions: {suggestions}"
            )
    except Exception as r_err:
        logger.warning("[Chat API] Failed to fetch resume doc: %s", r_err)

    # ── 3. Knowledge Vault RAG & Topics ──────────────────────────────────
    rag_context = ""
    try:
        doc_matches = query_documents(user_query, n_results=4)
        if doc_matches:
            rag_snippets = [f"- {d['content'][:250]}..." for d in doc_matches if d.get("content")]
            if rag_snippets:
                rag_context = "\n".join(rag_snippets)
    except Exception as v_err:
        logger.warning("[Chat API] ChromaDB search error: %s", v_err)

    # ── 4. Curriculum & Planner Status ────────────────────────────────────
    planner_summary = f"Active Prep Day: Day {current_day} of {duration_days} days.\n"
    curriculum = session.curriculum if session else {}
    if curriculum and "days" in curriculum:
        days_list = curriculum.get("days", [])
        today_tasks = []
        for d in days_list:
            if d.get("day") == current_day:
                for t in d.get("tasks", []):
                    status_icon = "✅" if t.get("status") == "done" else "⏳"
                    today_tasks.append(f"{status_icon} [{t.get('difficulty')}] {t.get('title')} ({t.get('type')})")
        if today_tasks:
            planner_summary += "Today's Tasks:\n" + "\n".join(today_tasks)

    # ── 5. Recall Topics ──────────────────────────────────────────────────
    recall_topics = ", ".join(session.interpreted_intent.get("skill_gaps", ["DSA", "System Design", "OS"])) if session and session.interpreted_intent else "DSA, System Design, OS"

    # ── 6. Construct System Prompt ────────────────────────────────────────
    system_prompt = f"""You are PlacementPal AI, an expert, encouraging, and highly technical Placement Preparation Mentor.
You are helping the candidate prepare for placement drives.

=== CANDIDATE PROFILE & CONTEXT ===
- Active Module / Page Currently Viewing: {current_page_label} ({body.current_page})
- Target Company: {target_comp_str}
- Target Role: {target_role_str}
- Preparation Timeline: Day {current_day} of {duration_days} Days Remaining

=== MODULE INTELLIGENCE ===
1. COMPANY INTEL:
{company_info_summary or 'Target company profile loaded.'}

2. RESUME & ATS EVALUATION:
{resume_summary}

3. DAILY PLANNER & CURRICULUM:
{planner_summary}

4. RECALL & FOCUS TOPICS:
Priority topics: {recall_topics}

5. KNOWLEDGE VAULT DOCS (RAG CONTEXT):
{rag_context or 'No specific notes found for this query.'}

=== STRICT FORMATTING INSTRUCTIONS (FOR ALL USER QUERIES) ===
- EVERY response MUST be strictly condensed, concise, and written in short single lines.
- NEVER output long paragraphs or walls of text under any circumstances.
- Structure ALL answers using short bullet points (`•`) and bold key terms (`**term**`).
- Keep descriptions brief (1 line per bullet point).
- Keep overall response under 4-6 total bullet lines.
- Keep tone direct, actionable, and encouraging.
"""

    # Build message history for LLM call
    messages = [SystemMessage(content=system_prompt)]
    for h_msg in body.history[-4:]:
        if h_msg.role == "user":
            messages.append(HumanMessage(content=h_msg.content))
        else:
            messages.append(AIMessage(content=h_msg.content))

    messages.append(HumanMessage(content=user_query))

    reply_text = ""
    try:
        llm = get_llm(temperature=0.3)
        response = await llm.ainvoke(messages)
        reply_text = str(response.content).strip()
    except Exception as llm_err:
        logger.warning("[Chat API] LLM call failed, generating contextual fallback: %s", llm_err)

    if not reply_text:
        # Fallback generator if LLM endpoint is unavailable
        reply_text = (
            f"Based on your current prep status for **{target_comp_str}** ({target_role_str}):\n\n"
            f"• **Active Focus:** Day {current_day} of {duration_days} days plan.\n"
            f"• **Recommended Action:** Review your target topics in {current_page_label}.\n"
            f"• **Weak Areas to Prioritize:** {recall_topics}.\n\n"
            f"Keep up the momentum! Feel free to ask specific questions about DSA, OS, DBMS, or System Design."
        )

    return APIResponse[dict[str, Any]](
        success=True,
        message="Chat response generated successfully",
        data={
            "reply": reply_text,
            "current_page": body.current_page,
            "target_company": target_comp_str,
            "target_role": target_role_str,
        },
    )
