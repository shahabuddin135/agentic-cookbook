# arch/auth.md — Auth Module (WARM)

```slc
@block ARCH auth_module
priority: critical
intent: "JWKS fetch+cache, JWT RS256 verification, get_current_user FastAPI dependency"
scope: module
depends_on: none

content:
  file: "backend/app/auth/jwt_verify.py"

  state:
    - "_jwks_cache: dict | None = None  # module-level"
    - "_jwks_fetched_at: datetime | None = None  # module-level"
    - "JWKS_TTL = timedelta(hours=1)"

  flows:
    jwks_fetch: >
      async def get_jwks() -> dict:
        Check module-level cache against JWKS_TTL.
        If stale or empty: httpx.AsyncClient(timeout=10.0).get(
          f"{BETTER_AUTH_URL}/api/auth/jwks"
        ) → store response JSON in cache + timestamp.
        Return cached dict.

    jwt_verify: >
      async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
      ) -> dict:
        token = credentials.credentials
        jwks = await get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"],
                             options={"verify_aud": False})
        user_id = payload.get("sub") or payload.get("userId")
        if not user_id: raise HTTPException(401, "Token missing user ID")
        return {"user_id": user_id, "payload": payload}
        # JWTError → HTTPException(401, str(exc), WWW-Authenticate: Bearer)

  security_instance: "security = HTTPBearer()"

  boundaries:
    - "Algorithm: RS256 only"
    - "verify_aud: False — no audience claim is set (see MEMORY.md)"
    - "Token expiry validated automatically by python-jose"
    - "JWKS URL: {BETTER_AUTH_URL}/api/auth/jwks — frontend must be running"
    - "httpx timeout=10.0 — prevents hanging if frontend is down"
    - "JWKS cache TTL: 1 hour"
    - "HTTPException 401 on any JWTError"
    - "HTTPException 403 from HTTPBearer when Authorization header missing"
@end
```
