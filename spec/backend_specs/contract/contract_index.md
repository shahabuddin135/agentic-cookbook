# contract_index.md — API Contract Registry (HOT)

> All 9 backend endpoints indexed by domain. Authoritative source of truth for API shapes.

```slc
@block INDEX contract_registry
priority: critical
intent: "API contract registry — endpoint index by domain"
scope: global
failure_if_skipped: true

content:
  total_endpoints: 9
  base_prefix: "/api"
  auth_scheme: "Bearer JWT (RS256, issued by Better Auth JWT plugin)"

  domains:
    - id: "agent"
      file: "contract/agent_api.md"
      endpoints: 1
      summary: "POST /api/agent/chat — SSE streaming recipe response"

    - id: "conversations"
      file: "contract/conversations_api.md"
      endpoints: 3
      summary: "GET, GET /{id}, DELETE /{id} /api/conversations"

    - id: "profile"
      file: "contract/profile_api.md"
      endpoints: 4
      summary: "GET/PUT /api/profile, GET /api/profile/export, DELETE /api/profile"

    - id: "consent"
      file: "contract/consent_api.md"
      endpoints: 1
      summary: "POST /api/consent — GDPR/CCPA consent logging (auth optional)"

  extras:
    - method: "GET"
      path: "/health"
      auth: none
      response: "{status: string, version: string}"
      note: "Always available — used for uptime checks and startup verification"
@end
```
