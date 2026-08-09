"""
app/graph/state_schema.py
──────────────────────────
LangGraph state type-annotation schema.

LangGraph v0.1 uses TypedDict for its state channel definitions.
We mirror the PlacementState Pydantic model here so the graph can
operate without Pydantic overhead in the hot path.
"""

from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict


class GraphState(TypedDict, total=False):
    """
    Channel definitions for both Phase-1 and Phase-2 LangGraph graphs.

    Every key becomes a named channel; LangGraph merges parallel node
    outputs into these slots automatically.
    """

    # ── Identity ──────────────────────────────────────────────
    session_id: str

    # ── User input ────────────────────────────────────────────
    user_message: str
    target_companies: list[str]
    target_roles: list[str]
    preparation_duration_days: int
    current_day: int

    # ── Phase 1 outputs ───────────────────────────────────────
    interpreted_intent: Optional[dict[str, Any]]
    company_intel: Optional[dict[str, Any]]
    vault_context: Optional[list[dict[str, Any]]]

    # ── Phase 2 outputs ───────────────────────────────────────
    recall_questions: Optional[list[dict[str, Any]]]
    curriculum: Optional[dict[str, Any]]

    # ── Parsed notification cache ─────────────────────────────
    parsed_notification: Optional[dict[str, Any]]

    # ── Meta ──────────────────────────────────────────────────
    errors: list[str]
