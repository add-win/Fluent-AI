# ─────────────────────────────────────────────────────────────────────────────
# PERSONAL MODE – No authentication required.
#
# FluentAI is configured for single-user personal use.
# All endpoints return data for a single fixed profile (PERSONAL_USER_ID).
# The original JWT / Supabase auth code is preserved below in comments for
# reference should multi-user support be re-enabled later.
# ─────────────────────────────────────────────────────────────────────────────

from .config import settings


def get_current_user() -> dict:
    """
    No-auth dependency.  Returns the single personal user for every request.
    All endpoint handlers that previously called `Depends(get_current_user)`
    continue to work unchanged — they just always see the same user.
    """
    return {
        "id": settings.PERSONAL_USER_ID,
        "email": "personal@fluentai.local",
        "role": "authenticated",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Original JWT / Supabase auth code (kept for reference)
# ─────────────────────────────────────────────────────────────────────────────
#
# import json, base64, requests as http_requests
# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import jwt, JWTError, jwk
# from .config import settings
#
# security = HTTPBearer()
# _jwks_cache: dict = {}
#
# def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
#     token = credentials.credentials
#     payload = verify_jwt(token)
#     user_id = payload.get("sub")
#     if not user_id:
#         raise HTTPException(status_code=401, detail="Token missing user ID")
#     return {"id": user_id, "email": payload.get("email"), "role": payload.get("role")}

