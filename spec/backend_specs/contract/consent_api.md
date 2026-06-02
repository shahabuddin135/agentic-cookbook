# contract/consent_api.md — Consent API Contract (WARM)

```slc
@block CONTRACT consent_api
priority: medium
intent: "GDPR/CCPA consent logging — optional auth, IP anonymized, two rows per call"
scope: module
depends_on: [arch/compliance.compliance_module]

content:
  router_prefix: "/api/consent"

  POST /:
    description: "Log user's consent preference. Auth optional — can be called pre-login."
    auth: optional
    request:
      headers:
        Authorization: "Bearer <jwt> — optional"
        Content-Type: "application/json"
      body:
        essential: "bool — always true (required to use the app)"
        analytics: "bool"
    response:
      status: 201
      body:
        id: "string (uuid of the essential consent_log row)"
    note: >
      Two rows created per call — one for 'essential' and one for 'analytics'.
      IP is extracted from request.client.host and stored as SHA-256 hash.
      user_id is null if no valid JWT provided.
    errors:
      422: "Invalid request body"
@end
```
