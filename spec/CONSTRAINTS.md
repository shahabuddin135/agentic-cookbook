# CONSTRAINTS.md — Reality Anchor

> Hard limits. These override ALL plans and tasks. No deviation without explicit user approval.

```slc
@block CONSTRAINTS hard_limits
priority: critical
intent: "Technology choices and hard limits — no deviation allowed"
scope: global
depends_on: none

content:
  tech:
    backend:
      language: "Python 3.11+"
      framework: "FastAPI 0.115.x"
      orm: "SQLModel + asyncpg"
      ai_agent: "openai-agents SDK (latest)"
      llm_proxy: "LiteLLM → Gemini 2.5 Flash"
      llm_model: "gemini/gemini-2.5-flash"
      mcp_tool_1: "Custom Local Recipe Scraper (local stdio via MCPServerStdio)"
      mcp_tool_2: "Pexels MCP Server (local stdio via MCPServerStdio)"
      auth_verification: "Better Auth JWT plugin + JWKS fetch (RS256 via python-jose)"
      database: "Neon PostgreSQL (serverless)"
      migrations: "None (SQLModel.metadata.create_all() on startup for custom tables)"
      package_manager: "uv"
      runner: "uvicorn[standard]"

    frontend:
      framework: "Next.js 16 (App Router, Turbopack default)"
      ui_library: "shadcn/ui + Tailwind CSS v4"
      auth_client: "Better Auth client + jwtClient plugin"
      auth_server: "Better Auth server hosted in Next.js (route handler /api/auth/[...all]) — serves JWKS the backend verifies against"
      state: "Zustand 5.x"
      server_state: "TanStack Query v5"
      package_manager: "Bun"
      next16_notes:
        - "Route protection uses proxy.ts (Next 16 renamed middleware → proxy; nodejs runtime only)"
        - "Async Request APIs: params, searchParams, cookies, headers are awaited Promises"
        - "Remote images configured via images.remotePatterns (images.domains is deprecated)"
        - "ESLint flat config; next lint removed (use eslint CLI)"

  scale:
    - "Single-user to small-team (< 1000 DAU at launch)"
    - "No horizontal scaling required at launch"
    - "Neon serverless handles connection pooling"
    - "In-memory rate limiting acceptable (no Redis required at launch)"

  hard_rules:
    - "JWT algorithm: RS256 only — signed by Better Auth JWT plugin"
    - "All FastAPI DB operations use async SQLModel sessions (no sync)"
    - "MCP servers are long-lived singletons started in FastAPI app lifespan"
    - "Agent output MUST be parseable JSON matching the RecipeCard schema"
    - "All FastAPI endpoints except GET /health require JWT authentication"
    - "IP addresses stored only as SHA-256 hash — never raw"
    - "requireEmailVerification is always false — no SMTP configuration"
    - "No email sending of any kind"
    - "JWT audience claim NOT set — backend uses verify_aud: False"
    - "db: AsyncSessionDep has no default value (= None forbidden)"
    - "Runner.run() used (not run_streamed) — single structured JSON output"
@end
```
