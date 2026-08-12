"""
app/auth_dependencies.py
─────────────────────────
FastAPI dependency-injection helpers for authentication.

Usage in route handlers:
    from app.auth_dependencies import get_current_user, get_current_user_id

    @router.get("/protected")
    async def protected(user = Depends(get_current_user)):
        ...
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import auth_service

logger = logging.getLogger(__name__)

# Bearer token extractor — looks for "Authorization: Bearer <token>"
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """
    Decode the JWT from the Authorization header and return the full user dict.

    Raises 401 if the token is missing, expired, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = auth_service.decode_jwt(credentials.credentials)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    return user


async def get_current_user_id(
    user: dict[str, Any] = Depends(get_current_user),
) -> str:
    """Convenience dependency that returns only the authenticated user's ID string."""
    return user["id"]
