"""
app/services/session_service.py
─────────────────────────────────
Service layer for session management.

All business logic for creating, reading, and updating placement sessions
belongs here. Route handlers should delegate to this service.
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Optional

from app.models.state import PlacementState, SessionPhase
from app.database.collections import get_sessions_collection

logger = logging.getLogger(__name__)


class SessionService:
    """Handles CRUD operations for placement sessions in MongoDB."""

    async def create_session(self, session_id: str) -> PlacementState:
        """Create a new placement session document in MongoDB."""
        col = get_sessions_collection()
        existing = await col.find_one({"session_id": session_id})
        if existing:
            existing.pop("_id", None)
            return PlacementState(**existing)

        now = datetime.utcnow()
        state = PlacementState(
            session_id=session_id,
            phase=SessionPhase.INIT,
            start_date=now.strftime("%Y-%m-%d"),
            created_at=now,
            updated_at=now,
        )
        doc = state.model_dump()
        await col.insert_one(doc)
        logger.info("Created new session in MongoDB: %s", session_id)
        return state

    async def get_session(self, session_id: str) -> Optional[PlacementState]:
        """Retrieve a session by ID."""
        col = get_sessions_collection()
        doc = await col.find_one({"session_id": session_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return PlacementState(**doc)

    async def update_session(
        self, session_id: str, updates: dict[str, Any]
    ) -> PlacementState:
        """Apply partial updates to an existing session."""
        col = get_sessions_collection()
        # Strip non-serializable fields and convert enums to strings
        safe_updates: dict[str, Any] = {}
        skip_keys = {"_id", "created_at"}
        for k, v in updates.items():
            if k in skip_keys:
                continue
            # Convert datetime to isoformat so Motor can store it
            if hasattr(v, "isoformat"):
                safe_updates[k] = v.isoformat()
            elif hasattr(v, "value"):  # Enum
                safe_updates[k] = v.value
            else:
                safe_updates[k] = v
        safe_updates["updated_at"] = datetime.utcnow()
        await col.update_one(
            {"session_id": session_id},
            {"$set": safe_updates},
            upsert=True,
        )
        updated_doc = await col.find_one({"session_id": session_id})
        if updated_doc:
            updated_doc.pop("_id", None)
            return PlacementState(**updated_doc)
        raise RuntimeError(f"Failed to update session {session_id}")

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session by ID."""
        col = get_sessions_collection()
        result = await col.delete_one({"session_id": session_id})
        return result.deleted_count > 0
