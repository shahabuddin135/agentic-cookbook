# PLAN.md — Frontend Execution Phases

> High-level phases only. No implementation detail (see arch/ and tasks/). Single-file mode (5 phases, <4KB).

```slc
@block PLAN frontend_plan
priority: high
intent: "Frontend build phases for Agentic Cookbook (Next 16)"
scope: global
depends_on: [arch/arch_index.frontend_arch_registry, contract/contract_index.frontend_contract_registry]

content:
  total_phases: 5

  phases:
    - id: 1
      name: "Foundation"
      summary: "Next 16 config (Bun, path alias, remotePatterns), shadcn/ui, Better Auth server+client, contract types + typed API client, state/providers"
      arch: [shell, auth]
      contract: [all]

    - id: 2
      name: "Auth & Layout"
      summary: "proxy.ts route protection (Next 16), sign-in/sign-up pages, protected app shell (Sidebar + Navbar)"
      arch: [auth, shell]

    - id: 3
      name: "Chat & Streaming"
      summary: "RecipeCard + skeleton, chat input, SSE fetch hook (use-chat), chat page assembly"
      arch: [chat]
      contract: [agent]

    - id: 4
      name: "Conversations"
      summary: "TanStack Query hooks, sidebar history, /chat/[id] conversation view (async params)"
      arch: [conversations]
      contract: [conversations]

    - id: 5
      name: "Profile & Compliance"
      summary: "Profile page, GDPR export/delete, cookie consent banner, static legal pages"
      arch: [profile, compliance]
      contract: [profile, consent]

  sequencing_rule: "Phases are ordered; later phases depend on earlier (foundation → auth/layout → features)."
@end
```
