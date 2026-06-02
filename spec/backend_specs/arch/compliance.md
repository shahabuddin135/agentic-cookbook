# arch/compliance.md — Compliance Module (WARM)

```slc
@block ARCH compliance_module
priority: high
intent: "GDPR/CCPA consent audit trail — ConsentLog model, consent router, IP anonymization"
scope: module
depends_on: [arch/database.database_module, arch/auth.auth_module]

content:
  files:
    - "backend/app/models/compliance.py"
    - "backend/app/routers/consent.py"

  data_model:
    ConsentLog:
      tablename: "consent_log"
      fields:
        id: "str — UUID PK"
        user_id: "Optional[str] = None — null if consent logged pre-authentication"
        consent_type: "str — 'essential' | 'analytics'"
        granted: "bool"
        ip_address_hash: "Optional[str] = None — SHA-256 hex of raw IP"
        user_agent: "Optional[str] = None"
        granted_at: "datetime — default=datetime.utcnow"
        revoked_at: "Optional[datetime] = None"

  flows:
    log_consent: >
      POST /api/consent
      Extract JWT if present (HTTPBearer auto_error=False) → user_id or None
      Extract IP from request.client.host
      ip_hash = hashlib.sha256(ip.encode()).hexdigest()
      Insert two ConsentLog rows:
        - ConsentLog(user_id, consent_type='essential', granted=True, ip_hash, user_agent)
        - ConsentLog(user_id, consent_type='analytics', granted=body.analytics, ip_hash, user_agent)
      Return 201 {id: first_row_id}

    anonymize_ip: >
      hashlib.sha256(ip.encode("utf-8")).hexdigest()
      Always UTF-8 encode before hashing for consistency.

  boundaries:
    - "Raw IP MUST be hashed before storage — storing plaintext IP is a SECURITY violation"
    - "user_id is nullable — consent may arrive before user is authenticated"
    - "Auth is OPTIONAL for POST /api/consent — HTTPBearer(auto_error=False)"
    - "consent_log retained 3 years post-deletion (user_id anonymised at deletion)"
    - "essential consent is always True (you can't use the app without it)"
@end
```
