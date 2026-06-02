# SECURITY.md — Global Security Law

> Overrides convenience, speed, and creativity. Violations must be explicitly reported — never silently corrected.

```slc
@block SECURITY global_security_law
priority: critical
intent: "Security rules that apply to ALL generated code — no exceptions"
scope: global
depends_on: none

content:
  backend_rules:
    - "All protected endpoints MUST call get_current_user Depends() — no exceptions"
    - "JWKS fetched over HTTPS only; TLS validation must remain enabled (no verify=False)"
    - "JWT expiry is validated automatically by python-jose on every decode call"
    - "No raw SQL — use SQLModel ORM exclusively (prevents SQL injection)"
    - "asyncpg SSL: sslmode=require in DATABASE_URL at all times"
    - "IP addresses anonymized via SHA-256 before any storage — never store raw IPs"
    - "CORS: ALLOWED_ORIGINS from config only — wildcard (*) is forbidden"
    - "Rate limit: max 10 agent requests per user per minute (HTTPException 429)"
    - "All secrets via environment variables only — never hardcoded in source"
    - "FastAPI docs_url=/docs only when DEBUG=true; None in production"
    - "StreamingResponse endpoints validate JWT BEFORE yielding the first byte"

  frontend_rules:
    - "JWT retrieved only via Better Auth client jwtClient() — never from localStorage"
    - "Session cookie: httpOnly=true, SameSite=Lax, Secure=true"
    - "No analytics or non-essential tracking fired before explicit user consent"
    - "Cookie consent banner shown on first visit before any non-essential code"

  api_rules:
    - "All requests to FastAPI include Authorization: Bearer <JWT>"
    - "FastAPI validates JWT on every protected request — no server-side session caching"
    - "DELETE /profile requires HTTP 202 (Accepted) — never immediate 200/204"
    - "POST /api/consent uses HTTPBearer(auto_error=False) — auth is optional"

  redaction_rules:
    - "No real names in any spec file — use {ROLE} placeholders"
    - "No credentials or tokens in plain text — use {PLACEHOLDER} format"
    - "No internal hostnames, IPs, or infrastructure URLs in spec files"
    - "API keys referenced as {GEMINI_API_KEY}, {APIFY_API_TOKEN}, {PEXELS_API_KEY}"
    - "Database URL referenced as {DATABASE_URL}"
    - "A .slc_secrets file (gitignored) holds real values for local resolution"
@end
```
