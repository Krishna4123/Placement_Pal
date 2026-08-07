"""
app/dependencies.py
───────────────────
FastAPI dependency-injection helpers.
Import these in route handlers to access shared resources.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.config import Settings, get_settings
from app.database.mongodb import get_database


# ── Re-exported convenience aliases ──────────────────────────

SettingsDep = Annotated[Settings, Depends(get_settings)]

# TODO: Add ChromaDB dependency once chroma.py is fully implemented.
# ChromaDep = Annotated[chromadb.Client, Depends(get_chroma_client)]
