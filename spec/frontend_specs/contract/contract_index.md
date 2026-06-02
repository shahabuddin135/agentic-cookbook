# contract_index.md — Frontend API Contract Registry (HOT)

> **DERIVED, NOT AUTHORED.** This mirrors `backend_specs/contract/` exactly — same domains, same file names.
> Backend contract is the single source of truth. Any divergence is a `CONTRACT_MISMATCH` and must be reported, not silently reconciled.
> These files define the **TypeScript types** (`types/contract.ts`) and the typed fetch client (`lib/api.ts`) the frontend consumes.

```slc
@block INDEX frontend_contract_registry
priority: critical
intent: "Frontend contract registry — mirrors backend contract; defines TS types + api client"
scope: global
failure_if_skipped: true

content:
  mirrors: "backend_specs/contract/contract_index.md"
  total_endpoints: 9
  api_base: "NEXT_PUBLIC_API_URL (e.g. http://localhost:8000)"
  auth: "Authorization: Bearer <jwt> from Better Auth jwtClient on every call (except optional on POST /api/consent)"
  ts_types_file: "types/contract.ts"
  api_client_file: "lib/api.ts"

  domains:
    - id: "agent"
      file: "contract/agent_api.md"
      backend_mirror: "backend_specs/contract/agent_api.agent_api"
      endpoints: 1
      summary: "POST /api/agent/chat — SSE; RecipeCardData type"

    - id: "conversations"
      file: "contract/conversations_api.md"
      backend_mirror: "backend_specs/contract/conversations_api.conversations_api"
      endpoints: 3
      summary: "list / get / delete; Conversation + Message types"

    - id: "profile"
      file: "contract/profile_api.md"
      backend_mirror: "backend_specs/contract/profile_api.profile_api"
      endpoints: 4
      summary: "get/update profile, export, delete; Profile type"

    - id: "consent"
      file: "contract/consent_api.md"
      backend_mirror: "backend_specs/contract/consent_api.consent_api"
      endpoints: 1
      summary: "POST consent (auth optional)"

  extras:
    - method: "GET"
      path: "/health"
      auth: none
      note: "Optional connectivity check; not used in app flows"
@end
```
