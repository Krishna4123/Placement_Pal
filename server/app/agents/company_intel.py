"""
app/agents/company_intel.py
────────────────────────────
CrewAI 1.x CompanyIntel agent.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from crewai import Agent

from app.utils.llm import get_fast_llm
from app.tools.web_scraper import search_company_placement_info


def create_company_intel_agent() -> Agent:
    """Instantiate and return the CompanyIntel CrewAI agent."""

    return Agent(
        role="Company Intelligence Analyst",
        goal=(
            "Research target tech companies thoroughly using real-time web search. "
            "Uncover their interview processes, frequently asked questions, required "
            "tech stacks, company culture, and recent hiring trends."
        ),
        backstory=(
            "You are a seasoned tech recruiter and competitive-intelligence "
            "specialist who has worked with Fortune 500 companies. You spent "
            "10 years inside top FAANG recruiting teams before transitioning to "
            "help students prepare."
        ),
        tools=[search_company_placement_info],
        llm=get_fast_llm(),
        verbose=True,
    )
