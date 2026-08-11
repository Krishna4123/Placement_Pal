"""
app/api/plan.py
────────────────
Router: /plan

Endpoints for managing the student's day-by-day study plan.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.services.planner_service import PlannerService
from app.models.request_models import MarkTaskRequest, AdvanceDayRequest, TaskResourcesRequest, UpdateStartDateRequest
from app.models.response_models import APIResponse, MarkTaskResponse, AdvanceDayResponse, TaskResourcesResponse, ResourceLink, UpdateStartDateResponse

router = APIRouter(prefix="/plan", tags=["Plan"])
planner_service = PlannerService()


@router.post(
    "/mark-task",
    summary="Update the status of a specific task",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[MarkTaskResponse],
)
async def mark_task(body: MarkTaskRequest):
    """
    Mark a task as pending / in_progress / done / skipped.
    """
    res = await planner_service.mark_task(body.session_id, body.task_id, body.status)
    resp_data = MarkTaskResponse(
        session_id=res["session_id"],
        task_id=res["task_id"],
        new_status=res["new_status"],
        updated=res["updated"],
    )
    return APIResponse[MarkTaskResponse](
        success=True,
        message="Task status updated",
        data=resp_data,
    )


@router.post(
    "/advance-day",
    summary="Advance the active study day for a session",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[AdvanceDayResponse],
)
async def advance_day(body: AdvanceDayRequest):
    """
    Move the session to the next (or a specified) study day.
    """
    res = await planner_service.advance_day(body.session_id, body.target_day)
    resp_data = AdvanceDayResponse(
        session_id=res["session_id"],
        previous_day=res["previous_day"],
        current_day=res["current_day"],
    )
    return APIResponse[AdvanceDayResponse](
        success=True,
        message="Active day advanced",
        data=resp_data,
    )


@router.post(
    "/task-resources",
    summary="Fetch resource links for a task via Tavily web search",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[TaskResourcesResponse],
)
async def get_task_resources(body: TaskResourcesRequest):
    """
    Uses Tavily to search for real resource links (LeetCode, GFG, HackerRank, etc.)
    for a given task. Returns a list of {title, url, source} objects.
    Only URLs are returned — no content scraping is done.
    """
    import asyncio
    from app.tools.web_scraper import search_task_resources_async

    links = await search_task_resources_async(
        task_title=body.task_title,
        task_type=body.task_type,
    )

    resp_data = TaskResourcesResponse(
        task_title=body.task_title,
        task_type=body.task_type,
        resources=[ResourceLink(**link) for link in links],
    )
    return APIResponse[TaskResourcesResponse](
        success=True,
        message=f"Found {len(links)} resources",
        data=resp_data,
    )


@router.post(
    "/update-start-date",
    summary="Update the plan start date for a session",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[UpdateStartDateResponse],
)
async def update_start_date(body: UpdateStartDateRequest):
    """
    Sets the YYYY-MM-DD start date for Day 1 of the preparation plan.
    """
    res = await planner_service.update_start_date(body.session_id, body.start_date)
    resp_data = UpdateStartDateResponse(
        session_id=res["session_id"],
        start_date=res["start_date"],
        updated=res["updated"],
    )
    return APIResponse[UpdateStartDateResponse](
        success=True,
        message="Plan start date updated successfully",
        data=resp_data,
    )

