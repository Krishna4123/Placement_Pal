"""
app/graph/phase1.py
────────────────────
LangGraph Phase-1 graph definition.

Flow:
    START
      │
      ▼
    interpret_message
      │
      ├──────────────────────┐
      ▼                      ▼
    company_intel      knowledge_vault   (parallel)
      │                      │
      └──────────┬───────────┘
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
    interpret_message_node,
    company_intel_node,
    knowledge_vault_node,
)

logger = logging.getLogger(__name__)


def build_phase1_graph():
    """Construct and compile the Phase-1 LangGraph."""

    builder = StateGraph(GraphState)

    # ── Register nodes ────────────────────────────────────────
    builder.add_node("interpret_message", interpret_message_node)
    builder.add_node("company_intel",     company_intel_node)
    builder.add_node("knowledge_vault",   knowledge_vault_node)

    # ── Entry point (LangGraph 1.x style) ────────────────────
    builder.add_edge(START, "interpret_message")

    # ── After interpretation, fan out to both intel nodes in parallel
    builder.add_edge("interpret_message", "company_intel")
    builder.add_edge("interpret_message", "knowledge_vault")

    # ── Both parallel nodes converge at END
    builder.add_edge("company_intel",   END)
    builder.add_edge("knowledge_vault", END)

    graph = builder.compile()
    logger.info("Phase-1 LangGraph compiled successfully.")
    return graph


# Module-level compiled graph (singleton)
try:
    phase1_graph = build_phase1_graph()
except Exception as _exc:
    logger.warning("Phase-1 graph could not be compiled: %s", _exc)
    phase1_graph = None
