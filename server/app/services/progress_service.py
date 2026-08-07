"""
app/services/progress_service.py
──────────────────────────────────
Service layer for tracking student progress metrics.
"""

from __future__ import annotations

from typing import Any


class ProgressService:
    """Aggregates and stores progress metrics for a placement session."""

    async def record_progress(
        self, session_id: str, day: int, metrics: dict[str, Any]
    ) -> None:
        """
        Persist daily progress metrics.

        TODO:
            - Upsert a progress document keyed by (session_id, day).
            - Store metrics: tasks_completed, time_spent_minutes, score, etc.
        """
        raise NotImplementedError("record_progress is not implemented.")

    async def get_progress(self, session_id: str) -> list[dict[str, Any]]:
        """
        Retrieve all progress records for a session.

        TODO:
            - Query 'progress' collection filtered by session_id.
            - Sort by day ascending.
        """
        raise NotImplementedError("get_progress is not implemented.")

    async def get_summary(self, session_id: str) -> dict[str, Any]:
        """
        Compute aggregate statistics for the session.

        TODO:
            - Total tasks completed, average daily score,
              completion percentage, streak count, etc.
        """
        raise NotImplementedError("get_summary is not implemented.")
