# Phase 1 — Foundation

```slc
@block PHASE phase_1_foundation
priority: critical
intent: "Scaffold the backend: structure, deps, config, DB, models, Alembic, app skeleton"
scope: phase-1
depends_on: none
estimate_minutes: 80

content:
  tasks: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]

  deliverable: >
    uvicorn starts cleanly.
    GET /health returns {status: "ok", version: "1.0.0"}.
    Neon DB has: conversation, message, consent_log, data_deletion_request tables.
    All custom SQLModel models importable without errors.

  prerequisite: >
    Better Auth frontend migration must be run FIRST (npx auth@latest migrate from
    the Next.js project). This creates the user, session, account, verification,
    jwks tables that Alembic must NOT touch.

  status: todo
@end
```
