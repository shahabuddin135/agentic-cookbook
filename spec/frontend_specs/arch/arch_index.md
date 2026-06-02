# arch_index.md — Frontend Architecture Registry (HOT)

> Module registry for the Agentic Cookbook frontend. Load a section by matching a task's `depends_on`.
> Stack: **Next.js 16 (App Router, Turbopack)**, React 19.2, Tailwind v4, shadcn/ui, Better Auth, Zustand 5, TanStack Query v5. Package manager: **Bun**.

```slc
@block INDEX frontend_arch_registry
priority: critical
intent: "Frontend architecture module registry — load section by depends_on match"
scope: global
failure_if_skipped: true

content:
  total_modules: 6
  framework: "Next.js 16 (App Router, Turbopack default, nodejs runtime)"
  api_base: "NEXT_PUBLIC_API_URL → FastAPI backend (default http://localhost:8000)"
  contract_source: "backend_specs/contract/* is authoritative — frontend types derive from it"

  next16_breaking_changes_in_use:
    - "proxy.ts replaces middleware.ts (route protection); exported fn is proxy()"
    - "params / searchParams / cookies() / headers() are async (await them)"
    - "images.remotePatterns (NOT images.domains) for Pexels recipe photos"
    - "Turbopack is default — no --turbopack flag in scripts"
    - "ESLint flat config; next lint removed"

  modules:
    - id: "shell"
      file: "arch/shell.md"
      summary: "App skeleton: root layout, providers (Query + Zustand), protected layout (Sidebar + Navbar), routing map, env"
      depends_on: none

    - id: "auth"
      file: "arch/auth.md"
      summary: "Better Auth server (route handler) + client, jwtClient plugin, JWT Bearer injection, proxy.ts route protection, sign-in/up pages"
      depends_on: [backend_specs/contract/consent_api, "Better Auth JWKS consumed by backend"]

    - id: "chat"
      file: "arch/chat.md"
      summary: "Chat page, SSE fetch streaming hook (use-chat), Zustand chat-store, RecipeCard + skeleton, ai-input-search"
      depends_on: [backend_specs/contract/agent_api]

    - id: "conversations"
      file: "arch/conversations.md"
      summary: "TanStack Query hooks for history, sidebar list, /chat/[id] conversation view (async params)"
      depends_on: [backend_specs/contract/conversations_api]

    - id: "profile"
      file: "arch/profile.md"
      summary: "Profile page (view/update name), GDPR export download, account deletion request"
      depends_on: [backend_specs/contract/profile_api]

    - id: "compliance"
      file: "arch/compliance.md"
      summary: "Cookie consent banner (consent_pref cookie + POST /api/consent), static /privacy and /terms pages"
      depends_on: [backend_specs/contract/consent_api]
@end
```
