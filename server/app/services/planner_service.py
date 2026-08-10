"""
app/services/planner_service.py
─────────────────────────────────
Service layer for curriculum / study-plan operations.

Handles task status updates and day advancement within a placement session.
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Optional

from app.database.collections import get_sessions_collection

logger = logging.getLogger(__name__)


class PlannerService:
    """Manages daily study plan state for a placement session."""

    async def mark_task(
        self, session_id: str, task_id: str, status: str
    ) -> dict[str, Any]:
        """
        Update the status of a single task within the session's curriculum.
        """
        col = get_sessions_collection()
        doc = await col.find_one({"session_id": session_id})
        if not doc:
            # Upsert a default session if missing
            doc = {
                "session_id": session_id,
                "current_day": 1,
                "curriculum": {"days": []},
            }

        curriculum = doc.get("curriculum") or {}
        days = curriculum.get("days", [])
        task_updated = False
        now = datetime.utcnow().isoformat()

        for day_item in days:
            tasks = day_item.get("tasks", [])
            for t in tasks:
                if t.get("task_id") == task_id or t.get("id") == task_id:
                    t["status"] = status
                    t["done"] = (status == "done")
                    if status == "done":
                        t["completed_at"] = now
                    task_updated = True
                    break
            if task_updated:
                break

        await col.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "curriculum": curriculum,
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )
        logger.info("Marked task %s status to %s for session %s", task_id, status, session_id)
        return {
            "session_id": session_id,
            "task_id": task_id,
            "new_status": status,
            "updated": True,
        }

    async def advance_day(
        self, session_id: str, target_day: Optional[int] = None
    ) -> dict[str, Any]:
        """
        Move the session's active day forward.
        """
        col = get_sessions_collection()
        doc = await col.find_one({"session_id": session_id})
        prev_day = doc.get("current_day", 1) if doc else 1
        new_day = target_day if target_day is not None else prev_day + 1

        await col.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "current_day": new_day,
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )
        logger.info("Advanced day for session %s from %d to %d", session_id, prev_day, new_day)
        return {
            "session_id": session_id,
            "previous_day": prev_day,
            "current_day": new_day,
        }

    async def get_day_plan(self, session_id: str, day: int) -> dict[str, Any]:
        """
        Return the task list for a specific day.
        """
        col = get_sessions_collection()
        doc = await col.find_one({"session_id": session_id})
        if not doc:
            return {"day": day, "tasks": []}

        curriculum = doc.get("curriculum") or {}
        days = curriculum.get("days", [])
        for d in days:
            if d.get("day") == day:
                return d
        return {"day": day, "tasks": []}
