from datetime import datetime, timedelta
import httpx
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings


JWKS_TTL = timedelta(hours=1)
_jwks_cache: dict | None = None
_jwks_fetched_at: datetime | None = None


async def get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at

    now = datetime.utcnow()
    if _jwks_cache and _jwks_fetched_at and (now - _jwks_fetched_at) < JWKS_TTL:
        return _jwks_cache

    jwks_url = f"{settings.BETTER_AUTH_URL}/api/auth/jwks"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_fetched_at = now

    return _jwks_cache


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        jwks = await get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub") or payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")
        return {"user_id": user_id, "payload": payload}
    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
