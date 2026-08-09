"""
app/main.py
───────────
FastAPI application entry point.

Starts the application, registers middleware, mounts routers,
and wires up startup / shutdown lifecycle events.

Run with:
    uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.routes import api_router
from app.utils.logger import setup_logging

# ── Bootstrap logging before anything else ───────────────────
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()

# ─────────────────────────────────────────────────────────────
# Application Factory
# ─────────────────────────────────────────────────────────────

def create_application() -> FastAPI:
    """Construct and configure the FastAPI application."""

    app = FastAPI(
        title=settings.app_title,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/docs",        # Swagger UI
        redoc_url="/redoc",      # ReDoc UI
        openapi_url="/openapi.json",
        debug=settings.debug,
    )

    # ── CORS ─────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],     # TODO: tighten in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Logging middleware ────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s → %d  (%.1f ms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response

    # ── Global exception handler ──────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "type": type(exc).__name__},
        )

    # ── Lifecycle events ──────────────────────────────────────
    @app.on_event("startup")
    async def on_startup():
        logger.info("PlacementPal API starting up...")
        await connect_to_mongo()
        logger.info("MongoDB connected")

    @app.on_event("shutdown")
    async def on_shutdown():
        logger.info("PlacementPal API shutting down...")
        await close_mongo_connection()

    # ── Routers ───────────────────────────────────────────────
    app.include_router(api_router)

    # ── Health check ──────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_application()
