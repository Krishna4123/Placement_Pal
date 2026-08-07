"""
app/services/session_service.py
─────────────────────────────────
Service layer for session management.

All business logic for creating, reading, and updating placement sessions
belongs here. Route handlers should delegate to this service.
"""

from __future__ import annotations

from typing import Any, Optional

from app.models.state import PlacementState


class SessionService:
    """Handles CRUD operations for placement sessions in MongoDB."""

    async def create_session(self, session_id: str) -> PlacementState:
        """
        Create a new placement session document in MongoDB.

        TODO:
            - Insert a new PlacementState document into the 'sessions' collection.
            - Return the newly created state.
        """
        raise NotImplementedError("create_session is not implemented.")

    async def get_session(self, session_id: str) -> Optional[PlacementState]:
        """
        Retrieve a session by ID.

        TODO:
            - Query the 'sessions' collection by session_id.
            - Deserialise to PlacementState and return, or None if not found.
        """
        raise NotImplementedError("get_session is not implemented.")

    async def update_session(
        self, session_id: str, updates: dict[str, Any]
    ) -> PlacementState:
        """
        Apply partial updates to an existing session.

        TODO:
            - Run a MongoDB $set update on the session document.
            - Refresh the updated_at timestamp.
        """
        raise NotImplementedError("update_session is not implemented.")

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session by ID.

        TODO:
            - Remove the document from the 'sessions' collection.
            - Return True if deleted, False if not found.
        """
        raise NotImplementedError("delete_session is not implemented.")
