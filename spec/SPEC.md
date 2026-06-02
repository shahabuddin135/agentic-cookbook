# SPEC.md — Agentic Cookbook Root Spec

> Global entry point. Read this file first. Follow `read_order` exactly.

```slc
@block INDEX spec_root
priority: critical
intent: "Global entry point — Agentic Cookbook project spec router"
scope: global
depends_on: none
failure_if_skipped: true

must_read_latest:
  - service: "FastAPI"
    url_hint: "context7://fastapi"
  - service: "SQLModel"
    url_hint: "context7://sqlmodel"
  - service: "OpenAI Agents SDK"
    url_hint: "context7://openai-agents"
  - service: "LiteLLM"
    url_hint: "context7://litellm"
  - service: "Better Auth"
    url_hint: "context7://better-auth"

read_order:
  - CONTEXT.md
  - CONSTRAINTS.md
  - SECURITY.md
  - MEMORY.md
  - backend_specs/arch/arch_index.md
  - backend_specs/contract/contract_index.md
  - backend_specs/PLAN.md
  - backend_specs/tasks/task_index.md
  - frontend_specs/arch/arch_index.md
  - frontend_specs/contract/contract_index.md
  - frontend_specs/PLAN.md
  - frontend_specs/tasks/task_index.md

content:
  short: "Agentic Cookbook — AI-powered recipe discovery. Follow read_order exactly."

  execution_rules:
    - "No code generation before ARCH files are finalized"
    - "task_index.md is locked after user approval — no new tasks added mid-phase"
    - "CONTRACT files are authoritative for all API shapes — frontend derives from them"
    - "MEMORY.md wins on any conflict with other files"
    - "SECURITY.md overrides convenience, speed, and all other concerns"
    - "Violations must abort execution and report to user — silent correction forbidden"
    - "Call Context7 MCP before implementing any library integration"

  approval_gate:
    - "LLM presents task_index.md to user before executing any task"
    - "User must explicitly approve or modify before execution begins"
    - "Once approved, tasks are locked — changes require explicit unlock"
@end
```
