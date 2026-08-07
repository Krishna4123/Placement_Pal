"""
app/models/response_models.py
──────────────────────────────
Pydantic v2 response models for all API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ── Generic wrapper ───────────────────────────────────────────

class APIResponse(BaseModel, Generic[T]):
    """Standard envelope used by every endpoint."""

    success: bool = True
    message: str = "OK"
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── /pipeline ────────────────────────────────────────────────

class Phase1Response(BaseModel):
    session_id: str
    phase: str
    interpreted_intent: Optional[dict[str, Any]] = None
    company_intel: Optional[dict[str, Any]] = None
    vault_context: Optional[list[dict[str, Any]]] = None
    status: str = "phase1_complete"


class Phase2Response(BaseModel):
    session_id: str
    phase: str
    recall_questions: Optional[list[dict[str, Any]]] = None
    curriculum: Optional[dict[str, Any]] = None
    status: str = "phase2_complete"


# ── /vault ────────────────────────────────────────────────────

class VaultUploadResponse(BaseModel):
    file_id: str
    filename: str
    chunks_ingested: int
    status: str = "uploaded"


class VaultQueryResponse(BaseModel):
    results: list[dict[str, Any]]
    total: int


class TopicResponse(BaseModel):
    topic_id: str
    name: str
    category: str
    status: str = "created"


# ── /plan ─────────────────────────────────────────────────────

class MarkTaskResponse(BaseModel):
    session_id: str
    task_id: str
    new_status: str
    updated: bool = True


class AdvanceDayResponse(BaseModel):
    session_id: str
    previous_day: int
    current_day: int


# ── /state ────────────────────────────────────────────────────

class StateResponse(BaseModel):
    session_id: str
    phase: str
    current_day: int
    target_companies: list[str]
    target_roles: list[str]
    curriculum_days_total: Optional[int] = None
    errors: list[str] = Field(default_factory=list)
