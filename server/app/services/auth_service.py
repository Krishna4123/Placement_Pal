"""
app/services/auth_service.py
──────────────────────────────
Authentication business logic: password hashing, JWT management,
Google token verification, and user CRUD against MongoDB.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from bson import ObjectId

from app.config import get_settings
from app.database.collections import get_users_collection

logger = logging.getLogger(__name__)

# ── Argon2id password hasher (singleton) ─────────────────────
_ph = PasswordHasher()


# ── Password helpers ─────────────────────────────────────────


def hash_password(raw_password: str) -> str:
    """Return an Argon2id hash of *raw_password*.  Never stores plaintext."""
    return _ph.hash(raw_password)


def verify_password(raw_password: str, password_hash: str) -> bool:
    """Verify *raw_password* against *password_hash*.  Returns True on match."""
    try:
        return _ph.verify(password_hash, raw_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


# ── JWT helpers ──────────────────────────────────────────────


def create_jwt(user_id: str) -> str:
    """Create a signed JWT with ``sub=user_id`` and a configurable expiry."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a JWT.  Raises ``jwt.PyJWTError`` on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


# ── Google token verification ────────────────────────────────


async def verify_google_token(credential: str) -> Optional[dict[str, Any]]:
    """
    Verify a Google ID token using ``google.oauth2.id_token``.

    Returns a dict with ``sub``, ``email``, ``name`` on success, or None.
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        settings = get_settings()
        id_info = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )

        if id_info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            logger.warning("Google token has unexpected issuer: %s", id_info.get("iss"))
            return None

        return {
            "sub": id_info["sub"],
            "email": id_info.get("email", ""),
            "name": id_info.get("name", ""),
        }
    except Exception:
        logger.exception("Google token verification failed")
        return None


# ── User CRUD ────────────────────────────────────────────────


async def create_user(
    *,
    name: str,
    email: str,
    password_hash: Optional[str] = None,
    auth_provider: str = "email",
    provider_user_id: Optional[str] = None,
) -> dict[str, Any]:
    """Insert a new user document.  Returns the document with stringified ``_id``."""
    col = get_users_collection()
    now = datetime.utcnow()
    doc = {
        "name": name,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "auth_provider": auth_provider,
        "provider_user_id": provider_user_id,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id
    logger.info("Created user %s (provider=%s)", email, auth_provider)
    return _serialise_user(doc)


async def get_user_by_email(email: str) -> Optional[dict[str, Any]]:
    """Look up a user by email (case-insensitive)."""
    col = get_users_collection()
    doc = await col.find_one({"email": email.lower().strip()})
    return _serialise_user(doc) if doc else None


async def get_user_by_id(user_id: str) -> Optional[dict[str, Any]]:
    """Look up a user by their MongoDB ``_id``."""
    col = get_users_collection()
    try:
        doc = await col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
    return _serialise_user(doc) if doc else None


async def get_user_by_provider(
    provider: str, provider_user_id: str
) -> Optional[dict[str, Any]]:
    """Look up a user by auth_provider + provider_user_id (e.g. Google sub)."""
    col = get_users_collection()
    doc = await col.find_one(
        {"auth_provider": provider, "provider_user_id": provider_user_id}
    )
    return _serialise_user(doc) if doc else None


# ── Internal helpers ─────────────────────────────────────────


def _serialise_user(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert MongoDB doc to a safe dict with stringified _id and no password_hash in the output key."""
    doc["id"] = str(doc.pop("_id"))
    # Keep password_hash internally for verification but never return via API
    return doc
