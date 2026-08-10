"""
app/api/state.py
─────────────────
Router: /state

Endpoints for reading the current placement session state.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, status

from app.services.session_service import SessionService
from app.models.response_models import APIResponse

router = APIRouter(prefix="/state", tags=["State"])
session_service = SessionService()


@router.get(
    "",
    summary="Get current placement session state",
    status_code=status.HTTP_200_OK,
)
async def get_state(session_id: str):
    """
    Return the full PlacementState for the given session, including
    company_intel, curriculum, recall_questions, and interpreted_intent
    so the frontend can render all pages correctly.
    """
    session = await session_service.get_session(session_id)
    if not session:
        session = await session_service.create_session(session_id)

    curriculum_days = None
    if session.curriculum and isinstance(session.curriculum, dict):
        curriculum_days = len(session.curriculum.get("days", []))

    # Return the complete state so every page has access to all fields
    full_state: dict[str, Any] = {
        "session_id": session.session_id,
        "phase": session.phase,
        "current_day": session.current_day,
        "target_companies": session.target_companies,
        "target_roles": session.target_roles,
        "preparation_duration_days": session.preparation_duration_days,
        "curriculum_days_total": curriculum_days or session.preparation_duration_days,
        "errors": session.errors or [],
        # Full pipeline outputs — used by CompanyPage, PlannerPage, CurriculumPage, RecallPage
        "interpreted_intent": session.interpreted_intent,
        "company_intel": session.company_intel,
        "vault_context": session.vault_context,
        "recall_questions": session.recall_questions,
        "curriculum": session.curriculum,
    }

    return APIResponse[dict[str, Any]](
        success=True,
        message="State retrieved successfully",
        data=full_state,
    )
