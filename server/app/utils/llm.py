"""
app/utils/llm.py
─────────────────
Centralized LLM factory.

All chains and agents must obtain their LLM from here so that the
institution-provided API key and base URL are applied consistently.

The custom base URL is loaded from the .env file via Settings and passed
directly to ChatOpenAI, which is fully compatible with any OpenAI-spec
endpoint (Azure OpenAI, LiteLLM proxies, vLLM, Together.ai, etc.).
"""

from __future__ import annotations

from functools import lru_cache

# pyrefly: ignore [missing-import]
from langchain_openai import ChatOpenAI

from app.config import get_settings


@lru_cache(maxsize=4)
def get_llm(
    temperature: float | None = None,
    model: str | None = None,
    streaming: bool = False,
) -> ChatOpenAI:
    """
    Return a ChatOpenAI instance configured with the institution's
    API key and base URL.

    Results are LRU-cached so repeated calls with the same arguments
    reuse the same object (avoids creating a new HTTP client per call).

    Args:
        temperature: Override the default temperature from settings.
        model:       Override the default model name from settings.
        streaming:   Enable streaming mode (for future WebSocket support).

    Returns:
        A ready-to-use ChatOpenAI instance.
    """
    settings = get_settings()

    return ChatOpenAI(
        model=model or settings.llm_model,
        temperature=temperature if temperature is not None else settings.llm_temperature,
        api_key=settings.openai_api_key,
        base_url=settings.openai_api_base or None,   # None → uses official OpenAI URL
        streaming=streaming,
        max_retries=1,
        request_timeout=20.0,
    )


def get_fast_llm() -> ChatOpenAI:
    """Low-temperature LLM for structured extraction tasks."""
    return get_llm(temperature=0.0)


def get_creative_llm() -> ChatOpenAI:
    """Slightly higher temperature for curriculum / recall generation."""
    return get_llm(temperature=0.3)
