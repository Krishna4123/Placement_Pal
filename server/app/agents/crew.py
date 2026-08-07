"""
app/agents/crew.py
───────────────────
PlacementPalCrew – updated for CrewAI 1.x.

Key CrewAI 1.x changes vs 0.x:
  - Agent no longer accepts max_iter / allow_delegation in constructor
  - Task.context is now called `context` (list of Task objects) — same API
  - Process.sequential still works
  - Crew.kickoff() returns CrewOutput object (not dict)
"""

from __future__ import annotations

import logging
from typing import Any

# pyrefly: ignore [missing-import]
from crewai import Crew, Process, Task

from app.agents.message_interpreter import create_message_interpreter_agent
from app.agents.company_intel import create_company_intel_agent
from app.agents.knowledge_vault import create_knowledge_vault_agent
from app.agents.recall_agent import create_recall_agent
from app.agents.curriculum_architect import create_curriculum_architect_agent

logger = logging.getLogger(__name__)


class PlacementPalCrew:
    """
    Registry and factory for all PlacementPal CrewAI agents (CrewAI 1.x).
    """

    def __init__(self) -> None:
        logger.info("Initialising PlacementPal CrewAI agents …")
        self.message_interpreter   = create_message_interpreter_agent()
        self.company_intel_agent   = create_company_intel_agent()
        self.knowledge_vault_agent = create_knowledge_vault_agent()
        self.recall_agent          = create_recall_agent()
        self.curriculum_architect  = create_curriculum_architect_agent()
        logger.info("All 5 CrewAI agents initialised successfully.")

    def get_phase1_crew(
        self,
        user_message: str,
        companies: list[str],
        roles: list[str],
    ) -> Crew:
        """Build the Phase-1 Crew for intent extraction + company research."""

        companies_str = ", ".join(companies) if companies else "top tech companies"
        roles_str = ", ".join(roles) if roles else "software engineering roles"

        interpret_task = Task(
            description=(
                f"Analyse this student message and extract structured placement intent:\n\n"
                f'"{user_message}"\n\n'
                f"Extract: target companies, target roles, preparation duration in days, "
                f"skill gaps, current skills, and study preferences."
            ),
            expected_output=(
                "A valid JSON object with keys: target_companies, target_roles, "
                "preparation_duration_days, skill_gaps, current_skills, preferences."
            ),
            agent=self.message_interpreter,
        )

        company_task = Task(
            description=(
                f"Research these companies for placement preparation: {companies_str}.\n"
                f"Target roles: {roles_str}.\n"
                f"Find: interview rounds, common topics, tech stack, difficulty, and tips."
            ),
            expected_output=(
                "A JSON object mapping each company name to its placement profile."
            ),
            agent=self.company_intel_agent,
            context=[interpret_task],
        )

        vault_task = Task(
            description=(
                f"Search the student's knowledge vault for materials relevant to "
                f"preparing for {companies_str} in {roles_str} roles."
            ),
            expected_output=(
                "A JSON object with: matched_topics, coverage_gaps, "
                "recommended_focus_areas, available_resources."
            ),
            agent=self.knowledge_vault_agent,
            context=[interpret_task],
        )

        return Crew(
            agents=[
                self.message_interpreter,
                self.company_intel_agent,
                self.knowledge_vault_agent,
            ],
            tasks=[interpret_task, company_task, vault_task],
            process=Process.sequential,
            verbose=True,
        )

    def get_phase2_crew(
        self,
        topics: list[str],
        companies: list[str],
        duration_days: int,
        vault_context: list[dict[str, Any]] | None = None,
    ) -> Crew:
        """Build the Phase-2 Crew for recall generation + curriculum planning."""

        topics_str = ", ".join(topics) if topics else "DSA, System Design, Core CS"
        companies_str = ", ".join(companies) if companies else "top tech companies"
        context_str = (
            "\n".join(r.get("content", "") for r in (vault_context or [])[:3])
            or "No vault context available."
        )

        recall_task = Task(
            description=(
                f"Generate active-recall practice questions for: {topics_str}.\n"
                f"Generate 8-10 questions per topic (easy/medium/hard mix).\n"
                f"Vault context:\n{context_str[:500]}"
            ),
            expected_output=(
                "A JSON object mapping each topic to a list of question dicts "
                "(question, answer, difficulty, question_type)."
            ),
            agent=self.recall_agent,
        )

        curriculum_task = Task(
            description=(
                f"Design a {duration_days}-day placement curriculum for {companies_str}.\n"
                f"Topics to cover: {topics_str}.\n"
                f"Create daily tasks with resource URLs."
            ),
            expected_output=(
                "A JSON curriculum with total_days, phases, and days array "
                "(each day has theme + task list)."
            ),
            agent=self.curriculum_architect,
            context=[recall_task],
        )

        return Crew(
            agents=[self.recall_agent, self.curriculum_architect],
            tasks=[recall_task, curriculum_task],
            process=Process.sequential,
            verbose=True,
        )


# ── Lazy singleton ────────────────────────────────────────────
_placement_crew: PlacementPalCrew | None = None


def get_placement_crew() -> PlacementPalCrew:
    """Lazily initialise and return the singleton PlacementPalCrew."""
    global _placement_crew
    if _placement_crew is None:
        _placement_crew = PlacementPalCrew()
    return _placement_crew
