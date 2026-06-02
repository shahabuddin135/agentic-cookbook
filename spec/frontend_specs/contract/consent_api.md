# contract/consent_api.md — Consent API (Frontend, DERIVED)

> Mirrors `backend_specs/contract/consent_api.consent_api`. Backend is authoritative.

```slc
@block CONTRACT frontend_consent_api
priority: medium
intent: "Client view of POST /api/consent + TS types"
scope: module
depends_on: [backend_specs/contract/consent_api, arch/compliance.compliance_module]

content:
  call:
    method: POST
    url: "${NEXT_PUBLIC_API_URL}/api/consent"
    auth: "OPTIONAL — Bearer JWT attached only if a session exists (banner may be answered pre-login)"
    headers:
      Content-Type: "application/json"
    body:
      essential: "boolean (always true)"
      analytics: "boolean (user choice)"
  response:
    status: 201
    body: "{ id: string }"
  errors:
    422: "invalid body"

  ts_types:
    ConsentRequest: "{ essential: true; analytics: boolean }"
    ConsentResponse: "{ id: string }"

  ui_invariants:
    - "Client never sends an IP — backend derives + SHA-256 hashes it"
    - "POST is best-effort; consent_pref cookie write is the source of truth for showing the banner"
@end
```
