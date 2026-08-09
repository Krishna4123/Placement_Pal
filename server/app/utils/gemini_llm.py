"""
app/utils/gemini_llm.py
────────────────────────
Dedicated Gemini LLM client — fully isolated from the OpenAI pipeline.

Used ONLY for notification parsing. Has its own API key, model, and
LangChain client so it never interferes with the Navigate Labs proxy.

Why separate?
  - The institution's OpenAI proxy is slow / rate-limited.
  - Gemini 1.5 Flash is free tier, very fast (< 3s), and handles
    unstructured text extraction extremely well.
  - Keeping it isolated means if Gemini fails, we fall back to regex
    without affecting Phase 1 / Phase 2 at all.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from app.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_gemini_llm():
    """
    Return a LangChain ChatGoogleGenerativeAI instance.

    Returns None if GEMINI_API_KEY is not configured — callers must
    handle this case and fall back to the regex parser.
    """
    settings = get_settings()

    if not settings.gemini_api_key or settings.gemini_api_key == "your-gemini-api-key-here":
        logger.warning(
            "GEMINI_API_KEY not set. Notification parser will use regex fallback. "
            "Set GEMINI_API_KEY in .env to enable Gemini-powered parsing."
        )
        return None

    try:
        # pyrefly: ignore [missing-import]
        from langchain_google_genai import ChatGoogleGenerativeAI

        llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.0,
            max_retries=1,
            request_timeout=15.0,
            # JSON output mode — Gemini returns clean structured data
            convert_system_message_to_human=True,
        )
        logger.info("Gemini LLM initialised (model=%s)", settings.gemini_model)
        return llm

    except ImportError:
        logger.error(
            "langchain-google-genai not installed. "
            "Run: pip install langchain-google-genai"
        )
        return None
    except Exception as e:
        logger.error("Failed to initialise Gemini LLM: %s", e)
        return None
