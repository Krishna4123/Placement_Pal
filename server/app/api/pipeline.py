"""
app/api/pipeline.py
────────────────────
Router: /pipeline

Endpoints for triggering the LangGraph AI pipeline phases.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.graph.phase1 import phase1_graph
from app.graph.phase2 import phase2_graph
from app.services.session_service import SessionService
from app.models.request_models import Phase1Request, Phase2Request
from app.models.response_models import APIResponse, Phase1Response, Phase2Response

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])
session_service = SessionService()


@router.post(
    "/phase1",
    summary="Run Phase-1 pipeline (interpret → company intel + vault retrieval)",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[Phase1Response],
)
async def run_phase1(body: Phase1Request):
    """
    Triggers the Phase-1 LangGraph:
      interpret_message → [company_intel || knowledge_vault]
    """
    session = await session_service.get_session(body.session_id)
    if not session:
        session = await session_service.create_session(body.session_id)

    # Build a clean dict for LangGraph — only include GraphState-compatible keys
    state_dict: dict = {
        "session_id": session.session_id,
        "user_message": body.user_message,
        "target_companies": body.target_companies or session.target_companies,
        "target_roles": body.target_roles or session.target_roles,
        "preparation_duration_days": body.preparation_duration_days or session.preparation_duration_days,
        "current_day": session.current_day,
        "interpreted_intent": session.interpreted_intent,
        "company_intel": session.company_intel,
        "vault_context": session.vault_context,
        "recall_questions": session.recall_questions,
        "curriculum": session.curriculum,
        "parsed_notification": session.parsed_notification,
        "errors": session.errors or [],
    }

    if phase1_graph is not None:
        output_state = await phase1_graph.ainvoke(state_dict)
    else:
        output_state = state_dict

    output_state["phase"] = "phase1"
    updated_session = await session_service.update_session(body.session_id, output_state)

    resp_data = Phase1Response(
        session_id=body.session_id,
        phase="phase1",
        interpreted_intent=updated_session.interpreted_intent,
        company_intel=updated_session.company_intel,
        vault_context=updated_session.vault_context,
        status="phase1_complete",
    )
    return APIResponse[Phase1Response](
        success=True,
        message="Phase-1 pipeline completed",
        data=resp_data,
    )


@router.post(
    "/phase2",
    summary="Run Phase-2 pipeline (recall generation → curriculum planning)",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[Phase2Response],
)
async def run_phase2(body: Phase2Request):
    """
    Triggers the Phase-2 LangGraph:
      generate_recall → curriculum_plan
    """
    session = await session_service.get_session(body.session_id)
    if not session:
        session = await session_service.create_session(body.session_id)

    state_dict: dict = {
        "session_id": session.session_id,
        "user_message": session.user_message,
        "target_companies": session.target_companies,
        "target_roles": session.target_roles,
        "preparation_duration_days": session.preparation_duration_days,
        "current_day": session.current_day,
        "interpreted_intent": session.interpreted_intent,
        "company_intel": session.company_intel,
        "vault_context": session.vault_context,
        "recall_questions": session.recall_questions,
        "curriculum": session.curriculum,
        "parsed_notification": session.parsed_notification,
        "errors": session.errors or [],
    }

    if body.additional_context:
        state_dict.update(body.additional_context)

    if phase2_graph is not None:
        output_state = await phase2_graph.ainvoke(state_dict)
    else:
        output_state = state_dict

    output_state["phase"] = "phase2"
    updated_session = await session_service.update_session(body.session_id, output_state)

    resp_data = Phase2Response(
        session_id=body.session_id,
        phase="phase2",
        recall_questions=updated_session.recall_questions,
        curriculum=updated_session.curriculum,
        status="phase2_complete",
    )
    return APIResponse[Phase2Response](
        success=True,
        message="Phase-2 pipeline completed",
        data=resp_data,
    )


from pydantic import BaseModel, Field

class RecallTopicRequest(BaseModel):
    topic: str = Field(..., description="Skill or topic to generate recall practice items for")
    target_company: str = Field(default="Target Company", description="Target company context")
    session_id: str = Field(default="active_session", description="Active session ID")

@router.post(
    "/recall-topic",
    summary="Generate dynamic active-recall questions for a specific resume skill or topic",
    status_code=status.HTTP_200_OK,
)
async def generate_recall_for_topic(body: RecallTopicRequest):
    """
    Generate 4 active recall practice questions tailored to a specific skill from the student's resume.
    """
    from app.chains.recall_chain import run_recall
    try:
        questions = await run_recall(
            topic=body.topic,
            context=f"Student declared proficiency in {body.topic} on their resume.",
            company_info=f"Preparing for {body.target_company} technical evaluation.",
            n_questions=4,
        )
        return APIResponse[dict](
            success=True,
            message=f"Recall questions generated for {body.topic}",
            data={"topic": body.topic, "questions": questions},
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("On-demand recall generation failed for %s: %s", body.topic, exc)
        # Fallback question set
        fallback_qs = [
            {"question": f"What are the core principles and key mechanisms of {body.topic}?", "answer": f"Core concepts in {body.topic} include fundamentals, design patterns, and standard optimizations.", "difficulty": "Medium", "question_type": "conceptual"},
            {"question": f"How do you optimize time and space complexity when working with {body.topic}?", "answer": "Use appropriate algorithms, caching, and data structures to avoid redundant computations.", "difficulty": "Medium", "question_type": "problem-solving"},
            {"question": f"What common trade-offs or edge cases occur when implementing {body.topic}?", "answer": "Consider memory overhead, concurrency issues, and input validation bounds.", "difficulty": "Hard", "question_type": "deep-dive"},
        ]
        return APIResponse[dict](
            success=True,
            message=f"Fallback recall questions generated for {body.topic}",
            data={"topic": body.topic, "questions": fallback_qs},
        )


@router.get(
    "/sessions",
    summary="List all active company placement sessions",
    status_code=status.HTTP_200_OK,
)
async def get_all_sessions():
    """
    Returns all placement sessions stored in MongoDB.
    """
    sessions = await session_service.list_sessions()
    session_list = []
    for s in sessions:
        session_list.append({
            "session_id": s.session_id,
            "target_companies": s.target_companies,
            "target_roles": s.target_roles,
            "phase": s.phase.value if hasattr(s.phase, "value") else str(s.phase),
            "parsed_notification": s.parsed_notification,
            "start_date": s.start_date,
            "updated_at": s.updated_at.isoformat() if hasattr(s.updated_at, "isoformat") else str(s.updated_at),
        })
    return APIResponse[list](
        success=True,
        message="Retrieved all placement sessions",
        data=session_list,
    )


@router.delete(
    "/session",
    summary="Delete a placement session by ID",
    status_code=status.HTTP_200_OK,
)
async def delete_placement_session(session_id: str):
    """
    Deletes a session document from MongoDB by session_id.
    """
    success = await session_service.delete_session(session_id)
    return APIResponse[dict](
        success=success,
        message=f"Session {session_id} deleted" if success else "Session not found",
        data={"session_id": session_id, "deleted": success},
    )

