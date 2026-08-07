"""
app/agents/curriculum_architect.py
────────────────────────────────────
CrewAI 1.x CurriculumArchitect agent.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from crewai import Agent

from app.utils.llm import get_creative_llm
from app.tools.coding_links import get_coding_links, get_all_coding_links
from app.tools.aptitude_links import get_aptitude_links, get_all_aptitude_links
from app.tools.web_scraper import search_company_placement_info


def create_curriculum_architect_agent() -> Agent:
    """Instantiate and return the CurriculumArchitect CrewAI agent."""

    return Agent(
        role="Placement Curriculum Architect",
        goal=(
            "Design a comprehensive, realistic, and personalised day-by-day "
            "placement preparation curriculum covering DSA, system design, "
            "core CS subjects, and company-specific topics."
        ),
        backstory=(
            "You are a former engineering manager at Google who has mentored hundreds "
            "of candidates into top tech companies. You create structured, realistic "
            "study plans that balance depth with breadth and adapt to individual timelines."
        ),
        tools=[
            get_coding_links,
            get_all_coding_links,
            get_aptitude_links,
            get_all_aptitude_links,
            search_company_placement_info,
        ],
        llm=get_creative_llm(),
        verbose=True,
    )
