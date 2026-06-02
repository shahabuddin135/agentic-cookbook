import hashlib
from uuid import uuid4
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from app.database import AsyncSessionDep
from app.models.compliance import ConsentLog
from app.config import settings
from app.auth.jwt_verify import get_jwks

router = APIRouter(prefix="/consent", tags=["consent"])

optional_bearer = HTTPBearer(auto_error=False)

class ConsentRequest(BaseModel):
    essential: bool
    analytics: bool

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
) -> Optional[str]:
    """Returns user_id if valid JWT present, else None."""
    if not credentials:
        return None
    try:
        jwks = await get_jwks()
        payload = jwt.decode(
            credentials.credentials,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub") or payload.get("userId")
    except JWTError:
        return None  # Invalid token treated same as no token

def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()

@router.post("", status_code=201)
async def log_consent(
    body: ConsentRequest,
    request: Request,
    db: AsyncSessionDep,
    user_id: Optional[str] = Depends(get_optional_user),
):
    raw_ip = request.client.host if request.client else None
    ip_hash = hash_ip(raw_ip) if raw_ip else None
    user_agent = request.headers.get("User-Agent")

    essential_id = str(uuid4())
    analytics_id = str(uuid4())

    db.add(ConsentLog(id=essential_id, user_id=user_id, consent_type="essential",
                       granted=True, ip_address_hash=ip_hash, user_agent=user_agent))
    db.add(ConsentLog(id=analytics_id, user_id=user_id, consent_type="analytics",
                       granted=body.analytics, ip_address_hash=ip_hash, user_agent=user_agent))
    await db.commit()

    return {"id": essential_id}
