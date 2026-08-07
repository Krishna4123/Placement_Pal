"""
app/models/topic.py
────────────────────
Topic and task models.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    EASY   = "easy"
    MEDIUM = "medium"
    HARD   = "hard"


class TaskStatus(str, Enum):
    PENDING     = "pending"
    IN_PROGRESS = "in_progress"
    DONE        = "done"
    SKIPPED     = "skipped"


class TaskItem(BaseModel):
    """A single actionable task within a day's study plan."""

    task_id: str = Field(..., description="Unique task identifier.")
    title: str
    description: str = ""
    resource_url: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    estimated_minutes: int = Field(default=30, ge=1)
    status: TaskStatus = TaskStatus.PENDING
    completed_at: Optional[datetime] = None


class TopicEntry(BaseModel):
    """
    A subject-area topic stored in the knowledge vault.
    Maps to a document in the *topics* MongoDB collection.
    """

    topic_id: Optional[str] = Field(default=None, alias="_id")
    name: str = Field(..., description="Topic name, e.g. 'Dynamic Programming'.")
    category: str = Field(..., description="High-level category, e.g. 'DSA'.")
    subtopics: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list, description="URLs or file refs.")
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    tags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "use_enum_values": True}
