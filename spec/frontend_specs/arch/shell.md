# arch/shell.md — App Shell Module (WARM)

```slc
@block ARCH shell_module
priority: critical
intent: "App skeleton — routing map, root + protected layouts, global providers, env config"
scope: module
depends_on: none

content:
  routing_map:
    - "/                       → app/page.tsx — landing; redirect to /chat if authed, else /sign-in"
    - "/sign-in                → app/(auth)/sign-in/page.tsx — public"
    - "/sign-up                → app/(auth)/sign-up/page.tsx — public"
    - "/chat                   → app/(app)/chat/page.tsx — protected; empty state + new chat"
    - "/chat/[id]              → app/(app)/chat/[id]/page.tsx — protected; params is async (await)"
    - "/profile                → app/(app)/profile/page.tsx — protected"
    - "/privacy                → app/(legal)/privacy/page.tsx — public static"
    - "/terms                  → app/(legal)/terms/page.tsx — public static"
    - "/api/auth/[...all]      → app/api/auth/[...all]/route.ts — Better Auth server handler"

  route_groups:
    - "(auth): centered card layout, no sidebar"
    - "(app): protected layout with persistent Sidebar + Navbar"
    - "(legal): minimal static layout"

  layouts:
    root: "app/layout.tsx — <html lang=en>, fonts, globals.css, wraps children in Providers + CookieBanner"
    protected: "app/(app)/layout.tsx — Sidebar (conversation history) + Navbar (user menu); client guard is belt-and-suspenders to proxy.ts"

  providers:
    file: "app/providers.tsx ('use client')"
    contains:
      - "QueryClientProvider (TanStack Query v5) — single QueryClient in useState"
      - "Better Auth context is not needed (authClient is a module singleton)"
      - "Zustand store is a module singleton — no provider required"
    note: "React context is client-only — Providers must be a Client Component rendered inside the Server root layout (Next 16 pattern)"

  folder_layout:
    - "app/                  — routes only (route groups, pages, layouts, api)"
    - "components/ui/        — shadcn/ui primitives"
    - "components/           — feature components (RecipeCard, Sidebar, Navbar, CookieBanner, ...)"
    - "lib/                  — auth.ts, auth-client.ts, api.ts (fetch wrapper), utils.ts"
    - "hooks/                — use-chat.ts, use-conversations.ts, use-profile.ts"
    - "store/                — chat-store.ts (Zustand)"
    - "types/                — contract.ts (TS types mirrored from backend contract)"
    - "proxy.ts              — route protection (project root)"

  env:
    - "NEXT_PUBLIC_API_URL    — FastAPI base URL (http://localhost:8000 dev)"
    - "BETTER_AUTH_URL        — this Next app's URL (http://localhost:3000 dev)"
    - "BETTER_AUTH_SECRET     — server secret"
    - "DATABASE_URL           — Neon POOLER url (serverless) for Better Auth tables"

  next16_config:
    file: "next.config.ts"
    must_include:
      - "images.remotePatterns: [{ protocol: 'https', hostname: 'images.pexels.com' }]"
    note: "Pexels photo host required because RecipeCard renders remote next/image"

  boundaries:
    - "Server Components by default; add 'use client' only to interactive leaves"
    - "Ports: frontend 3000, backend 8000 (per MEMORY)"
@end
```
