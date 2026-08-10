"""
app/api/debug.py
─────────────────
Router: /debug

Isolated Node Debugger Endpoint.
Allows testing individual graph nodes (e.g. Tavily search, company intel,
extraction, vault retrieval, recall, curriculum) without running full pipelines.
"""

from __future__ import annotations

import time
import logging
from typing import Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, status

from app.models.response_models import APIResponse

router = APIRouter(prefix="/debug", tags=["Debug"])
logger = logging.getLogger(__name__)


class NodeDebugRequest(BaseModel):
    node_name: str = Field(
        ...,
        description="Name of the node to test: 'company_intel', 'tavily_raw', 'interpret_message', 'knowledge_vault', 'generate_recall', 'curriculum_plan'",
    )
    company_name: str | None = "SurveySparrow"
    user_message: str | None = "SurveySparrow campus placement drive for SDE role"
    target_roles: list[str] | None = ["Software Engineer"]
    duration_days: int | None = 14
    topics: list[str] | None = ["Arrays", "System Design"]


@router.post(
    "/node",
    summary="Execute an isolated node for debugging",
    status_code=status.HTTP_200_OK,
)
async def test_node(body: NodeDebugRequest) -> APIResponse[dict[str, Any]]:
    """
    Runs a single node in isolation and returns output + execution time.
    """
    start_time = time.perf_counter()
    node = body.node_name.lower().strip()
    company = body.company_name or "SurveySparrow"
    output: dict[str, Any] = {}

    try:
        if node == "company_intel":
            from app.graph.nodes import company_intel_node
            state = {"target_companies": [company], "session_id": "debug_session"}
            res = await company_intel_node(state)
            output = res.get("company_intel", {})

        elif node == "tavily_raw":
            import asyncio
            from app.tools.web_scraper import get_tavily
            query_str = f"{company} software engineer placement interview process rounds 2024"
            search_results = await asyncio.to_thread(get_tavily().invoke, query_str)
            output = {"query": query_str, "results": search_results}

        elif node == "interpret_message":
            from app.graph.nodes import interpret_message_node
            state = {"user_message": body.user_message or "", "session_id": "debug_session"}
            res = await interpret_message_node(state)
            output = res.get("interpreted_intent", {})

        elif node == "knowledge_vault":
            from app.graph.nodes import knowledge_vault_node
            state = {
                "target_companies": [company],
                "target_roles": body.target_roles or ["Software Engineer"],
                "interpreted_intent": {"skill_gaps": body.topics or []},
                "session_id": "debug_session",
            }
            res = await knowledge_vault_node(state)
            output = {"vault_docs": res.get("vault_context", [])}

        elif node == "generate_recall":
            from app.graph.nodes import generate_recall_node
            state = {
                "target_companies": [company],
                "interpreted_intent": {"skill_gaps": body.topics or ["Arrays", "System Design"]},
                "company_intel": {company: {"common_topics": body.topics or ["DSA", "OS"]}},
                "session_id": "debug_session",
            }
            res = await generate_recall_node(state)
            output = {"recall_questions": res.get("recall_questions", [])}

        elif node == "curriculum_plan":
            from app.graph.nodes import curriculum_plan_node
            state = {
                "target_companies": [company],
                "target_roles": body.target_roles or ["Software Engineer"],
                "preparation_duration_days": body.duration_days or 14,
                "interpreted_intent": {"skill_gaps": body.topics or ["Dynamic Programming"]},
                "company_intel": {company: {"common_topics": ["DSA", "System Design"]}},
                "session_id": "debug_session",
            }
            res = await curriculum_plan_node(state)
            output = res.get("curriculum", {})

        else:
            return APIResponse[dict[str, Any]](
                success=False,
                message=f"Unknown node name '{node}'. Choose from: 'company_intel', 'tavily_raw', 'interpret_message', 'knowledge_vault', 'generate_recall', 'curriculum_plan'",
                data={},
            )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return APIResponse[dict[str, Any]](
            success=True,
            message=f"Node '{node}' executed successfully in {elapsed_ms}ms",
            data={
                "node_name": node,
                "execution_time_ms": elapsed_ms,
                "output": output,
            },
        )

    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.exception("Debug node execution failed: %s", exc)
        return APIResponse[dict[str, Any]](
            success=False,
            message=f"Node '{node}' failed: {str(exc)}",
            data={
                "node_name": node,
                "execution_time_ms": elapsed_ms,
                "error": str(exc),
            },
        )
