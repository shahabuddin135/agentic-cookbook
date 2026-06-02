# task_index.md — Frontend Task Registry

> **APPROVAL GATE** — Must be approved by user before any task executes. No code generation until `approval_status: APPROVED`.
> Status legend: `todo` | `in-progress` | `done` | `blocked`. This file is the single source of truth for status.

```slc
@block INDEX frontend_task_registry
priority: critical
intent: "Complete frontend task registry — single source of truth for execution status"
scope: global
failure_if_skipped: true

content:
  approval_status: "APPROVED"
  total_tasks: 19
  total_estimate_minutes: 360
  current_phase: 1

  phases:
    - phase: 1
      name: "Foundation"
      dir: "phases/phase-1/"
      tasks: 5
      estimate_minutes: 95
    - phase: 2
      name: "Auth & Layout"
      dir: "phases/phase-2/"
      tasks: 3
      estimate_minutes: 60
    - phase: 3
      name: "Chat & Streaming"
      dir: "phases/phase-3/"
      tasks: 4
      estimate_minutes: 95
    - phase: 4
      name: "Conversations"
      dir: "phases/phase-4/"
      tasks: 3
      estimate_minutes: 55
    - phase: 5
      name: "Profile & Compliance"
      dir: "phases/phase-5/"
      tasks: 4
      estimate_minutes: 55

  all_tasks:
    # ─── Phase 1: Foundation ───────────────────────────────────────────────
    - id: "1.1"
      file: "phases/phase-1/1.1_next16_config.md"
      title: "Next 16 project config — Bun, @/* path alias, next.config remotePatterns, scripts"
      depends_on: none
      estimate_minutes: 20
      status: done
    - id: "1.2"
      file: "phases/phase-1/1.2_shadcn_ui.md"
      title: "Install shadcn/ui + base components (button, input, card, dialog, alert-dialog, skeleton, ...)"
      depends_on: ["1.1"]
      estimate_minutes: 15
      status: done
    - id: "1.3"
      file: "phases/phase-1/1.3_better_auth.md"
      title: "Better Auth server (lib/auth.ts + /api/auth/[...all]) + client (lib/auth-client.ts) + jwtClient"
      depends_on: ["1.1"]
      estimate_minutes: 25
      status: done  # RS256 + snake_case verified; JWKS/sign-up/token tested end-to-end
    - id: "1.4"
      file: "phases/phase-1/1.4_contract_types_api.md"
      title: "Contract TS types (types/contract.ts) + typed API client with Bearer injection (lib/api.ts)"
      depends_on: ["1.3"]
      estimate_minutes: 20
      status: done  # types/index.ts + lib/api.ts; FIXED: Bearer must be RS256 JWT from /token, not session.token
    - id: "1.5"
      file: "phases/phase-1/1.5_state_providers.md"
      title: "Zustand chat-store + Providers (QueryClientProvider) wired into root layout"
      depends_on: ["1.1"]
      estimate_minutes: 15
      status: done  # store/chat-store.ts + components/providers.tsx

    # ─── Phase 2: Auth & Layout ────────────────────────────────────────────
    - id: "2.1"
      file: "phases/phase-2/2.1_proxy_protection.md"
      title: "Route protection via proxy.ts (Next 16) for /chat and /profile"
      depends_on: ["1.3"]
      estimate_minutes: 15
      status: done  # middleware.ts → proxy.ts; redirects verified (307 /chat→/sign-in)
    - id: "2.2"
      file: "phases/phase-2/2.2_auth_pages.md"
      title: "Sign-in and sign-up pages ((auth) route group) using Better Auth client"
      depends_on: ["1.3", "1.2"]
      estimate_minutes: 25
      status: todo
    - id: "2.3"
      file: "phases/phase-2/2.3_app_shell.md"
      title: "Protected (app) layout — Sidebar + Navbar"
      depends_on: ["1.2", "2.1"]
      estimate_minutes: 20
      status: todo

    # ─── Phase 3: Chat & Streaming ─────────────────────────────────────────
    - id: "3.1"
      file: "phases/phase-3/3.1_recipe_card.md"
      title: "RecipeCard component + skeleton loader (with Pexels attribution)"
      depends_on: ["1.4", "1.2"]
      estimate_minutes: 25
      status: todo
    - id: "3.2"
      file: "phases/phase-3/3.2_chat_input.md"
      title: "Chat input via @kokonutui/ai-input-search"
      depends_on: ["1.2"]
      estimate_minutes: 15
      status: todo
    - id: "3.3"
      file: "phases/phase-3/3.3_use_chat_sse.md"
      title: "SSE streaming hook use-chat.ts (fetch + ReadableStream, recipe/done/error)"
      depends_on: ["1.4", "1.5"]
      estimate_minutes: 30
      status: todo
    - id: "3.4"
      file: "phases/phase-3/3.4_chat_page.md"
      title: "Chat page assembly (empty/streaming/result/error states)"
      depends_on: ["3.1", "3.2", "3.3", "2.3"]
      estimate_minutes: 25
      status: todo

    # ─── Phase 4: Conversations ────────────────────────────────────────────
    - id: "4.1"
      file: "phases/phase-4/4.1_use_conversations.md"
      title: "TanStack Query hooks use-conversations.ts (list/get/delete)"
      depends_on: ["1.4"]
      estimate_minutes: 20
      status: todo
    - id: "4.2"
      file: "phases/phase-4/4.2_sidebar_history.md"
      title: "Populate Sidebar with conversation history + delete + new chat"
      depends_on: ["4.1", "2.3"]
      estimate_minutes: 15
      status: todo
    - id: "4.3"
      file: "phases/phase-4/4.3_conversation_view.md"
      title: "/chat/[id] view (async params) — message timeline + append"
      depends_on: ["4.1", "3.4"]
      estimate_minutes: 20
      status: todo

    # ─── Phase 5: Profile & Compliance ─────────────────────────────────────
    - id: "5.1"
      file: "phases/phase-5/5.1_profile_page.md"
      title: "Profile page — view + update name (use-profile.ts)"
      depends_on: ["1.4", "2.3"]
      estimate_minutes: 15
      status: todo
    - id: "5.2"
      file: "phases/phase-5/5.2_gdpr_export_delete.md"
      title: "GDPR export download + account deletion (202 soft-delete) wiring"
      depends_on: ["5.1"]
      estimate_minutes: 15
      status: todo
    - id: "5.3"
      file: "phases/phase-5/5.3_cookie_consent.md"
      title: "CookieBanner (consent_pref cookie + POST /api/consent)"
      depends_on: ["1.4"]
      estimate_minutes: 15
      status: todo
    - id: "5.4"
      file: "phases/phase-5/5.4_legal_pages.md"
      title: "Static /privacy and /terms pages ((legal) route group)"
      depends_on: ["1.1"]
      estimate_minutes: 10
      status: todo
@end
```
