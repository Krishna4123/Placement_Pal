"""
app/config.py
─────────────
Centralised settings loaded from the .env file via pydantic-settings.
All environment variables are validated at startup; the app will raise a
clear error if a required variable is missing.
"""

from __future__ import annotations

from functools import lru_cache

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration, sourced from the .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── LLM – Institution-provided credentials ────────────────
    # Your institution may give you a custom base URL that proxies
    # requests to an OpenAI-compatible endpoint (e.g. Azure OpenAI,
    # LiteLLM, vLLM, Together.ai, etc.).
    openai_api_key: str = "sk-placeholder"
    openai_api_base: str = ""          # Leave blank to use official OpenAI URL
    llm_model: str = "gpt-4o"
    llm_temperature: float = 0.0

    # ── Gemini (separate client for notification parsing) ─────
    # Used ONLY for fast notification parsing — fully isolated from OpenAI pipeline.
    gemini_api_key: str = ""           # Leave blank to fall back to regex parser
    gemini_model: str = "gemini-2.5-flash"

    # ── Tavily Search ─────────────────────────────────────────
    tavily_api_key: str = "tvly-placeholder"

    # ── MongoDB ───────────────────────────────────────────────
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "placementpal_db"

    # ── ChromaDB ──────────────────────────────────────────────
    chroma_directory: str = "./chroma_db"
    chroma_collection: str = "placement_vault"

    # ── Embeddings ────────────────────────────────────────────
    embedding_model: str = "text-embedding-3-small"

    # ── Authentication ────────────────────────────────────────
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440        # 24 hours
    google_client_id: str = ""

    # ── App ───────────────────────────────────────────────────
    debug: bool = True
    app_title: str = "PlacementPal API"
    app_description: str = "AI-powered placement preparation backend"
    app_version: str = "0.1.0"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton instance of Settings."""
    return Settings()
