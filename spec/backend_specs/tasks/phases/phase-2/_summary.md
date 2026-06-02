# Phase 2 — Authentication

```slc
@block PHASE phase_2_auth
priority: critical
intent: "JWKS fetch, JWT RS256 decode, get_current_user dependency, live token verification"
scope: phase-2
depends_on: ["phase-1"]
estimate_minutes: 40

content:
  tasks: [2.1, 2.2, 2.3, 2.4]

  prerequisite: >
    Phase 1 deliverable must be met.
    Next.js frontend must be running on port 3000 with Better Auth JWT plugin configured.
    BETTER_AUTH_URL in .env must point to the running frontend.

  deliverable: >
    GET /api/me with a valid Better Auth JWT returns {user_id: "...", payload: {...}}.
    GET /api/me without token returns 403.
    GET /api/me with expired token returns 401.

  status: todo
@end
```
