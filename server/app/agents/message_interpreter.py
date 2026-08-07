"""
app/agents/message_interpreter.py
───────────────────────────────────
CrewAI 1.x MessageInterpreter agent.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from crewai import Agent

from app.utils.llm import get_fast_llm


def create_message_interpreter_agent() -> Agent:
    """Instantiate and return the MessageInterpreter CrewAI agent."""

    return Agent(
        role="Placement Preparation Message Interpreter",
        goal=(
            "Analyse the student's free-text message and extract a precise, "
            "structured placement-prep intent: target companies, target roles, "
            "skill gaps, current knowledge level, timeline, and study preferences."
        ),
        backstory=(
            "You are an expert career counsellor with 15 years of experience "
            "helping students crack top-tier tech placements at FAANG, unicorn "
            "startups, and Fortune 500 companies. You excel at reading between "
            "the lines of a student's message and identifying exactly what they "
            "need to succeed."
        ),
        tools=[],
        llm=get_fast_llm(),
        verbose=True,
    )
