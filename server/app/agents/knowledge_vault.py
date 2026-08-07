"""
app/agents/knowledge_vault.py
──────────────────────────────
CrewAI 1.x KnowledgeVault agent.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from crewai import Agent

from app.utils.llm import get_fast_llm
from app.tools.topic_tools import search_topics_by_name, search_topics_by_tags


def create_knowledge_vault_agent() -> Agent:
    """Instantiate and return the KnowledgeVault CrewAI agent."""

    return Agent(
        role="Knowledge Vault Retrieval Specialist",
        goal=(
            "Search the student's personal knowledge vault to surface the most "
            "relevant study materials, past notes, and resources for the current "
            "preparation context."
        ),
        backstory=(
            "You are a librarian-turned-AI specialist with a deep understanding "
            "of semantic search and knowledge management. You excel at matching "
            "a student's learning goals with the most relevant knowledge stored "
            "in their vault."
        ),
        tools=[search_topics_by_name, search_topics_by_tags],
        llm=get_fast_llm(),
        verbose=True,
    )
