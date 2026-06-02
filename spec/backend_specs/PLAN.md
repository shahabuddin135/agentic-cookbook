# PLAN.md — Backend Execution Plan

```slc
@block PLAN backend_execution_plan
priority: high
intent: "Backend execution phases — 5 phases, 27 tasks, ~335 minutes"
scope: global
depends_on: [arch/arch_index.md, contract/contract_index.md]

content:
  total_phases: 5
  total_tasks: 27
  total_estimate_minutes: 335

  phases:
    - phase: 1
      name: "Foundation"
      dir: "tasks/phases/phase-1/"
      tasks: 8
      estimate_minutes: 80
      summary: >
        Scaffold project structure, install all dependencies, create config module,
        async database connection, SQLModel custom table models, SQLModel create_all on startup,
        and minimal FastAPI app skeleton with health check.
      deliverable: "uvicorn starts, GET /health returns 200, 4 custom tables in Neon"

    - phase: 2
      name: "Authentication"
      dir: "tasks/phases/phase-2/"
      tasks: 4
      estimate_minutes: 40
      summary: >
        JWKS fetch+cache, JWT RS256 decode with python-jose, get_current_user
        FastAPI dependency, and end-to-end auth verification with real tokens.
      deliverable: "GET /api/me with valid Better Auth JWT returns user_id"

    - phase: 3
      name: "AI Agent"
      dir: "tasks/phases/phase-3/"
      tasks: 5
      estimate_minutes: 60
      summary: >
        Configure Apify MCP (SSE) and Pexels MCP (stdio) servers, implement
        lifespan manager for singleton lifecycle, create recipe agent with
        LiteLLM model and system prompt, verify Runner.run() outputs valid JSON.
      deliverable: "Manual script returns RecipeCard JSON from live agent run"

    - phase: 4
      name: "Core API"
      dir: "tasks/phases/phase-4/"
      tasks: 5
      estimate_minutes: 75
      summary: >
        Agent chat SSE router with pre-stream DB writes, conversations CRUD router,
        per-user rate limiting middleware, CORS configuration, full app assembly.
      deliverable: "Smoke test: agent chat, conversations CRUD, rate limit all pass"

    - phase: 5
      name: "GDPR + Profile"
      dir: "tasks/phases/phase-5/"
      tasks: 5
      estimate_minutes: 80
      summary: >
        Profile GET/PUT, GDPR data export endpoint, account deletion queue,
        consent logging router, final integration verification checklist.
      deliverable: "All 9 API endpoints functional, GDPR rights implemented"

  sequencing_rules:
    - "Phase N+1 must not begin until Phase N deliverable is verified"
    - "Phase 3 requires frontend running (JWKS dependency)"
    - "SQLModel metadata.create_all() (via app lifespan) creates custom tables on startup"
    - "Better Auth frontend migration must run BEFORE backend starts"
@end
```
