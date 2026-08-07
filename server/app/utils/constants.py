"""
app/utils/constants.py
───────────────────────
Application-wide constants.
"""

from __future__ import annotations

# ── ChromaDB ──────────────────────────────────────────────────
DEFAULT_COLLECTION_NAME = "placement_vault"
CHROMA_HNSW_SPACE       = "cosine"

# ── Document chunking ─────────────────────────────────────────
DEFAULT_CHUNK_SIZE     = 1000   # characters
DEFAULT_CHUNK_OVERLAP  = 200    # characters

# ── Retrieval ─────────────────────────────────────────────────
DEFAULT_TOP_K = 5

# ── Session ───────────────────────────────────────────────────
MAX_PREPARATION_DAYS = 365
DEFAULT_PREPARATION_DAYS = 30

# ── Supported file types ──────────────────────────────────────
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".txt", ".md"}
MAX_UPLOAD_SIZE_MB = 20

# ── MongoDB TTL ───────────────────────────────────────────────
COMPANY_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

# ── LangChain / OpenAI ────────────────────────────────────────
DEFAULT_LLM_MODEL      = "gpt-4o"
DEFAULT_LLM_TEMPERATURE = 0.0
CURRICULUM_LLM_TEMPERATURE = 0.2
