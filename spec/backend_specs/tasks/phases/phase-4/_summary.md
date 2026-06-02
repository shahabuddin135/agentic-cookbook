# Phase 4 — Core API

```slc
@block PHASE phase_4_core_api
priority: critical
intent: "Agent chat SSE router, conversations CRUD, rate limiting, full app assembly"
scope: phase-4
depends_on: ["phase-3"]
estimate_minutes: 75

content:
  tasks: [4.1, 4.2, 4.3, 4.4, 4.5]

  prerequisites:
    - "Phase 1-3 deliverables met"
    - "Runner.run() validated with live agent (task 3.5)"

  deliverable: >
    Smoke test passes: agent chat returns recipe SSE stream,
    conversations CRUD works with auth, rate limit enforced,
    CORS headers present on OPTIONS preflight.

  status: todo
@end
```
