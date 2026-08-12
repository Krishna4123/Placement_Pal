"""
app/api/auth.py
────────────────
Router: /auth

Authentication endpoints: signup, login, Google sign-in, session check, logout.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.auth_models import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    SignUpRequest,
    UserPublic,
)
from app.services import auth_service
from app.auth_dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── POST /auth/signup ────────────────────────────────────────


@router.post(
    "/signup",
    summary="Register a new user with email and password",
    status_code=status.HTTP_201_CREATED,
    response_model=AuthResponse,
)
async def signup(body: SignUpRequest):
    """Create a new email/password account and return a JWT."""

    # 1. Passwords must match
    if body.password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    # 2. Check for existing email
    existing = await auth_service.get_user_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please sign in.",
        )

    # 3. Hash password (Argon2id — never store plaintext)
    password_hash = auth_service.hash_password(body.password)

    # 4. Create user document
    user = await auth_service.create_user(
        name=body.name.strip(),
        email=body.email,
        password_hash=password_hash,
        auth_provider="email",
    )

    # 5. Generate JWT
    token = auth_service.create_jwt(user["id"])

    return AuthResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            auth_provider=user["auth_provider"],
            is_active=user["is_active"],
            created_at=user.get("created_at"),
        ),
    )


# ── POST /auth/login ────────────────────────────────────────


@router.post(
    "/login",
    summary="Sign in with email and password",
    response_model=AuthResponse,
)
async def login(body: LoginRequest):
    """Verify credentials and return a JWT."""

    # 1. Find user by email
    user = await auth_service.get_user_by_email(body.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found. Please sign up first.",
        )

    # 2. If user signed up via Google, they have no password
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google Sign-In. Please sign in with Google.",
        )

    # 3. Verify password
    if not auth_service.verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 4. Generate JWT
    token = auth_service.create_jwt(user["id"])

    return AuthResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            auth_provider=user["auth_provider"],
            is_active=user["is_active"],
            created_at=user.get("created_at"),
        ),
    )


# ── POST /auth/google ───────────────────────────────────────


@router.post(
    "/google",
    summary="Sign in or register via Google",
    response_model=AuthResponse,
)
async def google_auth(body: GoogleAuthRequest):
    """
    Verify a Google ID token, create or find the user, and return a JWT.

    Account-linking safeguard: if a user with the same email already exists
    under a different provider, we inform them instead of silently merging.
    """

    # 1. Verify Google token
    google_info = await auth_service.verify_google_token(body.credential)
    if not google_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google sign-in failed. Please try again.",
        )

    google_sub = google_info["sub"]
    google_email = google_info["email"]
    google_name = google_info.get("name", google_email.split("@")[0])

    # 2. Look for existing Google user by provider_user_id
    user = await auth_service.get_user_by_provider("google", google_sub)

    if user:
        # Existing Google account → just sign in
        token = auth_service.create_jwt(user["id"])
        return AuthResponse(
            access_token=token,
            user=UserPublic(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                auth_provider=user["auth_provider"],
                is_active=user["is_active"],
                created_at=user.get("created_at"),
            ),
        )

    # 3. Check for email collision (e.g. user signed up with email+password first)
    existing_email_user = await auth_service.get_user_by_email(google_email)
    if existing_email_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email already exists. "
                "Please sign in using your existing method or contact support to link your Google account."
            ),
        )

    # 4. New Google user → create account (no password stored)
    user = await auth_service.create_user(
        name=google_name,
        email=google_email,
        password_hash=None,
        auth_provider="google",
        provider_user_id=google_sub,
    )

    token = auth_service.create_jwt(user["id"])

    return AuthResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            auth_provider=user["auth_provider"],
            is_active=user["is_active"],
            created_at=user.get("created_at"),
        ),
    )


# ── GET /auth/me ─────────────────────────────────────────────


@router.get(
    "/me",
    summary="Get the currently authenticated user",
    response_model=UserPublic,
)
async def get_me(user: dict = Depends(get_current_user)):
    """Return the authenticated user's public profile."""
    return UserPublic(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        auth_provider=user.get("auth_provider", "email"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at"),
    )


# ── POST /auth/logout ───────────────────────────────────────


@router.post(
    "/logout",
    summary="Log out (client-side token invalidation)",
    status_code=status.HTTP_200_OK,
)
async def logout():
    """
    Logout is handled client-side by discarding the JWT.

    This endpoint exists as an explicit acknowledgement point.
    A production system could maintain a token blocklist here.
    """
    return {"message": "Logged out successfully."}
