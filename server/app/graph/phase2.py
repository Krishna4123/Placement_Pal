"""
app/graph/phase2.py
────────────────────
LangGraph Phase-2 graph definition.

Flow:
    START
      │
      ▼
    generate_recall
      │
      ▼
    curriculum_plan
      │
      ▼
     END

Updated for LangGraph 1.x: uses START constant and add_edge(START, ...) instead
of the deprecated set_entry_point().
"""

from __future__ import annotations

import logging

from langgraph.graph import StateGraph, END, START

from app.graph.state_schema import GraphState
from app.graph.nodes import (
    generate_recall_node,
    curriculum_plan_node,
)

logger = logging.getLogger(__name__)


def build_phase2_graph():
    """Construct and compile the Phase-2 LangGraph."""

    builder = StateGraph(GraphState)

    # ── Register nodes ────────────────────────────────────────
    builder.add_node("generate_recall",  generate_recall_node)
    builder.add_node("curriculum_plan",  curriculum_plan_node)

    # ── Entry point (LangGraph 1.x style) ────────────────────
    builder.add_edge(START, "generate_recall")

    # ── Sequential flow ───────────────────────────────────────
    builder.add_edge("generate_recall", "curriculum_plan")
    builder.add_edge("curriculum_plan", END)

    graph = builder.compile()
    logger.info("Phase-2 LangGraph compiled successfully.")
    return graph


# Module-level compiled graph (singleton)
try:
    phase2_graph = build_phase2_graph()
except Exception as _exc:
    logger.warning("Phase-2 graph could not be compiled: %s", _exc)
    phase2_graph = None
