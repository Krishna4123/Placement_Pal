"""
app/models/request_models.py
─────────────────────────────
Pydantic v2 request body models for all API endpoints.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── /pipeline ────────────────────────────────────────────────

class Phase1Request(BaseModel):
    """Request body for POST /pipeline/phase1."""

    session_id: str = Field(..., description="Client-generated or server-assigned session UUID.")
    user_message: str = Field(..., min_length=1, description="The user's free-text input.")
    target_companies: list[str] = Field(default_factory=list)
    target_roles: list[str] = Field(default_factory=list)
    preparation_duration_days: int = Field(default=30, ge=1, le=365)


class Phase2Request(BaseModel):
    """Request body for POST /pipeline/phase2."""

    session_id: str
    additional_context: Optional[dict[str, Any]] = None


# ── /vault ────────────────────────────────────────────────────

class VaultQueryRequest(BaseModel):
    """Request body for POST /vault/query."""

    query: str = Field(..., min_length=1)
    collection_name: str = Field(default="placement_vault")
    n_results: int = Field(default=5, ge=1, le=50)


class TopicCreateRequest(BaseModel):
    """Request body for POST /vault/topics."""

    name: str = Field(..., min_length=1)
    category: str
    subtopics: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)
    difficulty: str = Field(default="medium")
    tags: list[str] = Field(default_factory=list)


# ── /plan ─────────────────────────────────────────────────────

class MarkTaskRequest(BaseModel):
    """Request body for POST /plan/mark-task."""

    session_id: str
    task_id: str
    status: str = Field(..., description="One of: pending, in_progress, done, skipped.")


class AdvanceDayRequest(BaseModel):
    """Request body for POST /plan/advance-day."""

    session_id: str
    target_day: Optional[int] = Field(
        default=None,
        description="If omitted, advances to current_day + 1.",
    )


class TaskResourcesRequest(BaseModel):
    """Request body for POST /plan/task-resources."""

    task_title: str = Field(..., min_length=1, description="The title of the task to fetch resources for.")
    task_type: str = Field(default="coding", description="One of: coding, aptitude, core.")


class UpdateStartDateRequest(BaseModel):
    """Request body for POST /plan/update-start-date."""

    session_id: str
    start_date: str = Field(..., description="Date string in YYYY-MM-DD format.")

