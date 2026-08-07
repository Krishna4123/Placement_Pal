"""
app/api/plan.py
────────────────
Router: /plan

Endpoints for managing the student's day-by-day study plan.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.models.request_models import MarkTaskRequest, AdvanceDayRequest

router = APIRouter(prefix="/plan", tags=["Plan"])


@router.post(
    "/mark-task",
    summary="Update the status of a specific task",
    status_code=status.HTTP_200_OK,
)
async def mark_task(body: MarkTaskRequest):
    """
    Mark a task as pending / in_progress / done / skipped.

    TODO:
        - Delegate to PlannerService.mark_task()
        - Return real MarkTaskResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Task status updated (mock)",
            "data": {
                "session_id": body.session_id,
                "task_id": body.task_id,
                "new_status": body.status,
                "updated": True,
            },
        },
    )


@router.post(
    "/advance-day",
    summary="Advance the active study day for a session",
    status_code=status.HTTP_200_OK,
)
async def advance_day(body: AdvanceDayRequest):
    """
    Move the session to the next (or a specified) study day.

    TODO:
        - Delegate to PlannerService.advance_day()
        - Return real AdvanceDayResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Day advanced (mock)",
            "data": {
                "session_id": body.session_id,
                "previous_day": 1,
                "current_day": body.target_day or 2,
            },
        },
    )
