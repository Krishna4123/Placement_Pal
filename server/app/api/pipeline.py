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
