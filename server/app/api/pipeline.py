"""
app/api/pipeline.py
────────────────────
Router: /pipeline

Endpoints for triggering the LangGraph AI pipeline phases.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.models.request_models import Phase1Request, Phase2Request

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.post(
    "/phase1",
    summary="Run Phase-1 pipeline (interpret → company intel + vault retrieval)",
    status_code=status.HTTP_200_OK,
)
async def run_phase1(body: Phase1Request):
    """
    Triggers the Phase-1 LangGraph:
      interpret_message → [company_intel || knowledge_vault]

    TODO:
        - Invoke phase1_graph.ainvoke(state_dict)
        - Persist updated session to MongoDB via SessionService
        - Return real Phase1Response
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Phase-1 mock response",
            "data": {
                "session_id": body.session_id,
                "phase": "phase1",
                "interpreted_intent": {"mock": True},
                "company_intel": {"mock": True},
                "vault_context": [{"mock": True}],
                "status": "phase1_complete",
            },
        },
    )


@router.post(
    "/phase2",
    summary="Run Phase-2 pipeline (recall generation → curriculum planning)",
    status_code=status.HTTP_200_OK,
)
async def run_phase2(body: Phase2Request):
    """
    Triggers the Phase-2 LangGraph:
      generate_recall → curriculum_plan

    TODO:
        - Load existing session state from MongoDB
        - Invoke phase2_graph.ainvoke(state_dict)
        - Persist curriculum to MongoDB via PlannerService
        - Return real Phase2Response
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Phase-2 mock response",
            "data": {
                "session_id": body.session_id,
                "phase": "phase2",
                "recall_questions": [{"mock": True}],
                "curriculum": {"mock": True, "days": []},
                "status": "phase2_complete",
            },
        },
    )
