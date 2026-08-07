"""
app/api/state.py
─────────────────
Router: /state

Endpoints for reading the current placement session state.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/state", tags=["State"])


@router.get(
    "",
    summary="Get current placement session state",
    status_code=status.HTTP_200_OK,
)
async def get_state(session_id: str):
    """
    Return a snapshot of the active PlacementState for the given session.

    Args:
        session_id: Query parameter identifying the session.

    TODO:
        - Load session via SessionService.get_session()
        - Map to StateResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "State retrieved (mock)",
            "data": {
                "session_id": session_id,
                "phase": "init",
                "current_day": 1,
                "target_companies": ["Google", "Amazon"],
                "target_roles": ["SDE-1"],
                "curriculum_days_total": 30,
                "errors": [],
            },
        },
    )
