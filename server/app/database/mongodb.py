"""
app/database/mongodb.py
───────────────────────
Singleton Motor (async MongoDB) client.

Provides:
  - connect_to_mongo()   – called on app startup
  - close_mongo_connection() – called on app shutdown
  - get_database()       – returns the AsyncIOMotorDatabase instance
"""

from __future__ import annotations

import logging

# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

# Module-level singletons – managed by lifecycle events in main.py
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Open the Motor connection pool. Called once at application startup."""
    global _client, _db

    settings = get_settings()
    logger.info("Connecting to MongoDB at %s …", settings.mongodb_uri)

    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client[settings.database_name]

    # Verify connectivity with a lightweight ping
    await _db.command("ping")
    logger.info("MongoDB ping OK (database: %s)", settings.database_name)

    # Ensure unique index on users.email for authentication
    await _db["users"].create_index("email", unique=True)
    logger.info("Ensured unique index on users.email")


async def close_mongo_connection() -> None:
    """Close the Motor connection pool. Called once at application shutdown."""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """
    Return the active database instance.

    Raises RuntimeError if called before connect_to_mongo() has completed.
    """
    if _db is None:
        raise RuntimeError(
            "MongoDB is not connected. Ensure connect_to_mongo() has been awaited."
        )
    return _db
