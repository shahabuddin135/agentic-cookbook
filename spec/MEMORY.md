# MEMORY.md — Anti-Hallucination Anchor

> Frozen facts and decisions. This file ALWAYS wins on any conflict. Do not change without user approval.

```slc
@block MEMORY frozen_decisions
priority: critical
intent: "Locked decisions — overrides all other files on conflict"
scope: global
depends_on: none

content:
  decisions:
    auth:
      - "requireEmailVerification is permanently false — accounts are active on sign-up"
      - "JWT audience claim is NOT set in the JWT plugin config"
      - "Backend uses verify_aud: False — intentional, not an oversight"
      - "JWT algorithm: RS256 signed by Better Auth JWT plugin"
      - "JWKS TTL: 1 hour in-memory cache"

    agent:
      - "Runner.run() is used — NOT Runner.run_streamed()"
      - "Agent returns a single structured JSON string (not token-by-token chunks)"
      - "SSE contract: exactly two events — recipe event then done event"
      - "SSE event types: 'recipe', 'done', 'error' — no 'chunk' event type"
      - "RecipeCard JSON shape: {message, recipe:{...}, image:{...}}"

    database:
      - "db: AsyncSessionDep has NO default (= None is forbidden — breaks DI)"
      - "Better Auth manages: user, session, account, verification, jwks tables"
      - "SQLModel metadata.create_all() manages: conversation, message, consent_log, data_deletion_request"
      - "FastAPI does NOT write to Better Auth tables (except user.name via PUT /profile)"
      - "Message.metadata_ python attr maps to 'metadata' JSONB column in Postgres"

    gdpr:
      - "Soft delete: 30-day grace period before account data purge"
      - "consent_log retained 3 years even after account deletion (user_id anonymised)"
      - "data_deletion_request retained 3 years (audit trail)"
      - "DELETE /api/profile returns 202 Accepted (not 204)"

    frontend:
      - "Framework changed from Next.js 15 → Next.js 16.2.7 — APPROVED deviation from original CONSTRAINTS (user approved 2026-06-03)"
      - "Next 16: route protection file is proxy.ts (NOT middleware.ts); exported function is proxy(); nodejs runtime only"
      - "Next 16: params/searchParams in pages, cookies()/headers() are async — must be awaited"
      - "Next 16: Pexels images require images.remotePatterns in next.config.ts (images.domains deprecated)"
      - "Better Auth SERVER is hosted in the Next.js app — it owns the Neon user/session/account/jwks tables and serves JWKS that FastAPI verifies"
      - "frontend/AGENTS.md mandates reading node_modules/next/dist/docs/ before writing Next code (non-standard Next 16)"
      - "shadcn preset is base-nova → components are built on Base UI (@base-ui/react), NOT Radix. Use the `render` prop for composition, NOT `asChild`. lucide-react icons, sonner toasts."

    frontend_better_auth_setup:
      - "better-auth 1.6.13. JWT plugin MUST be configured alg RS256 (keyPairConfig: { alg: 'RS256', modulusLength: 2048 }) — default is EdDSA which the backend cannot verify"
      - "Better Auth columns default to camelCase; the `casing` option only renames TABLES not columns. Snake_case columns (per schema.dbml) require explicit per-model `fields` mapping on user/session/account/verification AND the jwt plugin `schema.jwks.fields`"
      - "kysely is PINNED to 0.28.17 via package.json overrides — kysely 0.29.2 drops DEFAULT_MIGRATION_TABLE and breaks @better-auth/kysely-adapter"
      - "DATABASE_URL for Next.js must be plain postgres pooler URL; lib/auth.ts normalizes the backend's postgresql+asyncpg://...?ssl=require form (strips +asyncpg and ssl param, forces Pool ssl)"
      - "Migrations run via scripts/migrate.mts (bun run db:migrate) — the @better-auth/cli pulls in better-sqlite3 which fails to native-build on Windows"
      - "scripts/db-reset-auth.mts is a one-off reconciliation (aborts unless auth tables empty) — not for routine use"

    infrastructure:
      - "Neon pooler URL for Next.js (serverless); direct URL for FastAPI asyncpg"
      - "EU region Neon instance preferred for GDPR compliance"
      - "Frontend port: 3000; Backend port: 8000"
      - "MCP server names (immutable): local_recipes, pexels_images"
      - "Pexels MCP installed as uv package: pexels-mcp-server"

  assumptions:
    - "Node.js 20+ available on backend server (required for Apify MCP remote SSE)"
    - "BETTER_AUTH_URL points to Next.js app (must be running for JWKS to work)"
    - "Neon direct connection URL format: postgresql+asyncpg://user:pass@host/db"

  do_not_change:
    - "RecipeCard JSON schema (message + recipe object + image object)"
    - "SSE event type names: recipe, done, error"
    - "GDPR endpoint paths: GET /api/profile/export, DELETE /api/profile"
    - "MCP server names in code: local_recipes, pexels_images"
    - "RS256 JWT algorithm"
    - "IP anonymization algorithm: SHA-256"
@end
```
