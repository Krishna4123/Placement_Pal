"""
app/agents/recall_agent.py
───────────────────────────
CrewAI 1.x RecallAgent.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from crewai import Agent

from app.utils.llm import get_creative_llm
from app.tools.web_scraper import search_topic_resources
from app.tools.coding_links import get_coding_links


def create_recall_agent() -> Agent:
    """Instantiate and return the RecallAgent CrewAI agent."""

    return Agent(
        role="Active Recall & Spaced Repetition Coach",
        goal=(
            "Generate high-quality, varied practice questions, coding challenges, "
            "and spaced-repetition flashcards that reinforce the student's "
            "understanding of each topic in the curriculum."
        ),
        backstory=(
            "You are a cognitive-science PhD who specialises in learning efficiency "
            "for technical interviews. You use proven techniques like active recall "
            "and spaced repetition to dramatically accelerate skill retention."
        ),
        tools=[search_topic_resources, get_coding_links],
        llm=get_creative_llm(),
        verbose=True,
    )
