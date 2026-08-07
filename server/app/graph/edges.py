"""
app/graph/edges.py
───────────────────
LangGraph edge / routing functions.

Edge functions receive the current GraphState and return the name of
the next node (or END) as a string.

TODO: Add conditional routing logic as business rules are defined.
"""

from __future__ import annotations

from langgraph.graph import END

from app.graph.state_schema import GraphState


def route_after_interpret(state: GraphState) -> str:
    """
    Called after interpret_message_node.

    Routes to the parallel fan-out of company_intel and knowledge_vault.

    TODO:
        - Add error checking: if interpreted_intent is None, route to an
          error handler node instead.
    """
    if state.get("errors"):
        # TODO: define an 'error_handler' node and route here
        return END  # type: ignore[return-value]
    return "parallel_intel"


def route_after_phase1(state: GraphState) -> str:
    """
    Called after both parallel Phase-1 nodes complete.

    Currently routes straight to END; Phase-2 is triggered by a separate
    API call rather than chained automatically.

    TODO: Optionally chain Phase-2 here for fully autonomous runs.
    """
    return END  # type: ignore[return-value]


def route_after_recall(state: GraphState) -> str:
    """
    Called after generate_recall_node in Phase-2.

    Routes to curriculum_plan_node.

    TODO:
        - Add guard: if recall_questions is empty, skip or retry.
    """
    return "curriculum_plan"
