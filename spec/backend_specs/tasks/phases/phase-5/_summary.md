# Phase 5 — GDPR + Profile

```slc
@block PHASE phase_5_gdpr
priority: high
intent: "Profile read/update, data export, erasure queue, consent logging, final verification"
scope: phase-5
depends_on: ["phase-4"]
estimate_minutes: 80

content:
  tasks: [5.1, 5.2, 5.3, 5.4, 5.5]

  deliverable: >
    All 9 API endpoints functional.
    GDPR rights implemented: GET /api/profile/export returns JSON file attachment,
    DELETE /api/profile returns 202 and creates deletion_request row,
    POST /api/consent logs consent with hashed IP.
    Final verification checklist passes.

  status: todo
@end
```
