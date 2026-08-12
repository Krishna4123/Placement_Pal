"""
app/models/auth_models.py
──────────────────────────
Pydantic v2 request / response models for authentication endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr


# ── Request Models ───────────────────────────────────────────


class SignUpRequest(BaseModel):
    """Request body for POST /auth/signup."""

    name: str = Field(..., min_length=1, max_length=100, description="User's full name.")
    email: EmailStr = Field(..., description="User's email address.")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars).")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Must match password.")


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    email: EmailStr = Field(..., description="Registered email address.")
    password: str = Field(..., min_length=1, description="Account password.")


class GoogleAuthRequest(BaseModel):
    """Request body for POST /auth/google."""

    credential: str = Field(..., min_length=1, description="Google ID token from GIS client.")


# ── Response Models ──────────────────────────────────────────


class UserPublic(BaseModel):
    """Safe user representation returned to the frontend — never includes password_hash."""

    id: str
    name: str
    email: str
    auth_provider: str = "email"
    is_active: bool = True
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Returned on successful signup / login / google auth."""

    access_token: str
    token_type: str = "bearer"
    user: UserPublic
