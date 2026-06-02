# task_index.md — Backend Task Registry

> **APPROVAL GATE** — This file must be approved by user before any task executes.
> Status legend: `todo` | `in-progress` | `done` | `blocked`

```slc
@block INDEX task_registry
priority: critical
intent: "Complete backend task registry — single source of truth for execution status"
scope: global
failure_if_skipped: true

content:
  approval_status: "APPROVED"
  total_tasks: 26
  total_estimate_minutes: 320
  current_phase: 1

  phases:
    - phase: 1
      name: "Foundation"
      tasks: 7
      estimate_minutes: 65

    - phase: 2
      name: "Authentication"
      tasks: 4
      estimate_minutes: 40

    - phase: 3
      name: "AI Agent"
      tasks: 5
      estimate_minutes: 60

    - phase: 4
      name: "Core API"
      tasks: 5
      estimate_minutes: 75

    - phase: 5
      name: "GDPR + Profile"
      tasks: 5
      estimate_minutes: 80

  all_tasks:
    # ─── Phase 1: Foundation ───────────────────────────────────────────────
    - id: "1.1"
      file: "phases/phase-1/1.1_project_structure.md"
      title: "Initialize project directory structure"
      depends_on: none
      estimate_minutes: 10
      status: done

    - id: "1.2"
      file: "phases/phase-1/1.2_dependencies.md"
      title: "Install dependencies via UV (pyproject.toml)"
      depends_on: ["1.1"]
      estimate_minutes: 10
      status: blocked

    - id: "1.3"
      file: "phases/phase-1/1.3_config.md"
      title: "Configuration module (config.py + .env template)"
      depends_on: ["1.2"]
      estimate_minutes: 10
      status: done

    - id: "1.4"
      file: "phases/phase-1/1.4_database.md"
      title: "Async database connection module (database.py)"
      depends_on: ["1.3"]
      estimate_minutes: 10
      status: done

    - id: "1.5"
      file: "phases/phase-1/1.5_conversation_models.md"
      title: "Conversation + Message SQLModel models"
      depends_on: ["1.4"]
      estimate_minutes: 10
      status: done

    - id: "1.6"
      file: "phases/phase-1/1.6_compliance_models.md"
      title: "Compliance SQLModel models (ConsentLog, DataDeletionRequest)"
      depends_on: ["1.4"]
      estimate_minutes: 10
      status: done

    - id: "1.8"
      file: "phases/phase-1/1.8_app_skeleton.md"
      title: "FastAPI app skeleton (main.py — health check only)"
      depends_on: ["1.4", "1.5", "1.6"]
      estimate_minutes: 5
      status: done

    # ─── Phase 2: Authentication ──────────────────────────────────────────
    - id: "2.1"
      file: "phases/phase-2/2.1_jwks_fetch.md"
      title: "JWKS fetch + 1-hour in-memory cache"
      depends_on: ["1.3"]
      estimate_minutes: 10
      status: done

    - id: "2.2"
      file: "phases/phase-2/2.2_jwt_verify.md"
      title: "JWT RS256 decode + get_current_user dependency"
      depends_on: ["2.1"]
      estimate_minutes: 10
      status: done

    - id: "2.3"
      file: "phases/phase-2/2.3_auth_wiring.md"
      title: "Add temporary GET /api/me test route"
      depends_on: ["2.2", "1.8"]
      estimate_minutes: 10
      status: done

    - id: "2.4"
      file: "phases/phase-2/2.4_auth_test.md"
      title: "Verify auth flow with real JWT from Better Auth"
      depends_on: ["2.3"]
      estimate_minutes: 10
      status: todo

    # ─── Phase 3: AI Agent ─────────────────────────────────────────────────
    - id: "3.1"
      file: "phases/phase-3/3.1_apify_mcp.md"
      title: "Apify MCP server (SSE) configuration"
      depends_on: ["1.3"]
      estimate_minutes: 15
      status: done

    - id: "3.2"
      file: "phases/phase-3/3.2_pexels_mcp.md"
      title: "Pexels MCP server (stdio) configuration"
      depends_on: ["3.1"]
      estimate_minutes: 10
      status: done

    - id: "3.3"
      file: "phases/phase-3/3.3_mcp_lifespan.md"
      title: "MCP lifespan manager + app.state.mcp_servers"
      depends_on: ["3.2", "1.8"]
      estimate_minutes: 10
      status: done

    - id: "3.4"
      file: "phases/phase-3/3.4_recipe_agent.md"
      title: "Recipe agent (system prompt + LiteLLM model)"
      depends_on: ["3.3"]
      estimate_minutes: 15
      status: done

    - id: "3.5"
      file: "phases/phase-3/3.5_runner_integration.md"
      title: "Runner.run() integration + JSON output validation"
      depends_on: ["3.4"]
      estimate_minutes: 10
      status: done

    # ─── Phase 4: Core API ─────────────────────────────────────────────────
    - id: "4.1"
      file: "phases/phase-4/4.1_agent_router.md"
      title: "Agent chat router — ChatRequest + SSE event_stream"
      depends_on: ["3.5", "2.2", "1.5"]
      estimate_minutes: 20
      status: done

    - id: "4.2"
      file: "phases/phase-4/4.2_conversations_router.md"
      title: "Conversations CRUD router (list, get, delete)"
      depends_on: ["1.5", "2.2"]
      estimate_minutes: 15
      status: done

    - id: "4.3"
      file: "phases/phase-4/4.3_rate_limiting.md"
      title: "Per-user in-memory rate limiting (10 req/min)"
      depends_on: ["2.2"]
      estimate_minutes: 15
      status: done

    - id: "4.4"
      file: "phases/phase-4/4.4_cors_assembly.md"
      title: "CORS middleware + include all routers in main.py"
      depends_on: ["4.1", "4.2", "3.3"]
      estimate_minutes: 10
      status: done

    - id: "4.5"
      file: "phases/phase-4/4.5_smoke_test.md"
      title: "Smoke test: health, auth, agent chat, conversations"
      depends_on: ["4.4"]
      estimate_minutes: 15
      status: todo

    # ─── Phase 5: GDPR + Profile ───────────────────────────────────────────
    - id: "5.1"
      file: "phases/phase-5/5.1_profile_router.md"
      title: "Profile router — GET + PUT /api/profile"
      depends_on: ["2.2", "1.4"]
      estimate_minutes: 15
      status: todo

    - id: "5.2"
      file: "phases/phase-5/5.2_data_export.md"
      title: "GDPR data export — GET /api/profile/export"
      depends_on: ["5.1", "1.5"]
      estimate_minutes: 20
      status: todo

    - id: "5.3"
      file: "phases/phase-5/5.3_account_deletion.md"
      title: "GDPR erasure queue — DELETE /api/profile"
      depends_on: ["5.1", "1.6"]
      estimate_minutes: 15
      status: todo

    - id: "5.4"
      file: "phases/phase-5/5.4_consent_router.md"
      title: "Consent logging router — POST /api/consent"
      depends_on: ["1.6", "1.4"]
      estimate_minutes: 15
      status: todo

    - id: "5.5"
      file: "phases/phase-5/5.5_final_verification.md"
      title: "Final integration verification checklist"
      depends_on: ["5.1", "5.2", "5.3", "5.4"]
      estimate_minutes: 15
      status: todo
@end
```
