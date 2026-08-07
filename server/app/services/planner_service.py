"""
app/services/planner_service.py
─────────────────────────────────
Service layer for curriculum / study-plan operations.

Handles task status updates and day advancement within a placement session.
"""

from __future__ import annotations

from typing import Any


class PlannerService:
    """Manages daily study plan state for a placement session."""

    async def mark_task(
        self, session_id: str, task_id: str, status: str
    ) -> dict[str, Any]:
        """
        Update the status of a single task within the session's curriculum.

        TODO:
            - Find the session document.
            - Locate the task by task_id inside curriculum.days[n].tasks.
            - Apply the new status and set completed_at if status == 'done'.
            - Persist the update back to MongoDB.
        """
        raise NotImplementedError("mark_task is not implemented.")

    async def advance_day(
        self, session_id: str, target_day: int | None = None
    ) -> dict[str, Any]:
        """
        Move the session's active day forward.

        Args:
            session_id: Target session.
            target_day: Specific day to jump to. If None, increments by 1.

        TODO:
            - Validate target_day is within curriculum range.
            - Update current_day in the session document.
            - Return updated state.
        """
        raise NotImplementedError("advance_day is not implemented.")

    async def get_day_plan(self, session_id: str, day: int) -> dict[str, Any]:
        """
        Return the task list for a specific day.

        TODO:
            - Retrieve session, extract curriculum.days[day].
        """
        raise NotImplementedError("get_day_plan is not implemented.")
