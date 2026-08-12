"""
app/database/collections.py
────────────────────────────
Named collection accessors for Motor.

Usage:
    from app.database.collections import get_sessions_collection
    sessions = get_sessions_collection()
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorCollection

from app.database.mongodb import get_database

# ── Collection name constants ─────────────────────────────────
SESSIONS_COLLECTION     = "sessions"
TOPICS_COLLECTION       = "topics"
VAULT_FILES_COLLECTION  = "vault_files"
PROGRESS_COLLECTION     = "progress"
COMPANY_CACHE_COLLECTION = "company_cache"
USERS_COLLECTION        = "users"


def get_sessions_collection() -> AsyncIOMotorCollection:
    return get_database()[SESSIONS_COLLECTION]


def get_topics_collection() -> AsyncIOMotorCollection:
    return get_database()[TOPICS_COLLECTION]


def get_vault_files_collection() -> AsyncIOMotorCollection:
    return get_database()[VAULT_FILES_COLLECTION]


def get_progress_collection() -> AsyncIOMotorCollection:
    return get_database()[PROGRESS_COLLECTION]


def get_company_cache_collection() -> AsyncIOMotorCollection:
    return get_database()[COMPANY_CACHE_COLLECTION]


def get_users_collection() -> AsyncIOMotorCollection:
    return get_database()[USERS_COLLECTION]
