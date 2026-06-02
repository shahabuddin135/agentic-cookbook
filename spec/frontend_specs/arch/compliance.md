# arch/compliance.md — Compliance Module (WARM)

```slc
@block ARCH compliance_module
priority: medium
intent: "Cookie consent banner + static legal pages (GDPR/CCPA)"
scope: module
depends_on: [backend_specs/contract/consent_api]

content:
  contract_anchor:
    - "POST /api/consent { essential: bool (always true), analytics: bool } → 201 { id }"
    - "Auth OPTIONAL — banner can be shown/answered before login (user_id null server-side)"
    - "Backend hashes IP (SHA-256) and writes two rows (essential + analytics) per call"

  cookie_banner:
    file: "components/cookie-banner.tsx ('use client')"
    cookie: "consent_pref — first-party cookie storing the user's choice"
    behavior:
      - "Render only if consent_pref cookie is absent"
      - "Essential is always true (required to use the app); analytics is the user's toggle"
      - "On Accept/Reject → set consent_pref cookie AND POST /api/consent { essential:true, analytics:<choice> }"
      - "POST is best-effort; banner dismisses on cookie write regardless of network result"
    placement: "Mounted once in root layout (visible across public + protected routes)"

  legal_pages:
    privacy: "(legal)/privacy/page.tsx — static Server Component; data collected, retention (consent 3y, deletion grace 30d), rights"
    terms: "(legal)/terms/page.tsx — static Server Component"
    note: "Static content only — placeholder legal copy; no PII, no real org details (SECURITY redaction rules)"

  boundaries:
    - "Analytics scripts (if any) load ONLY when analytics consent === true"
    - "Never send raw IP from the client — backend derives + hashes it"
@end
```
