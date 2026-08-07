"""
app/api/routes.py
──────────────────
Aggregates all sub-routers into a single api_router that is mounted
in app/main.py.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.pipeline import router as pipeline_router
from app.api.vault import router as vault_router
from app.api.plan import router as plan_router
from app.api.state import router as state_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(pipeline_router)
api_router.include_router(vault_router)
api_router.include_router(plan_router)
api_router.include_router(state_router)
