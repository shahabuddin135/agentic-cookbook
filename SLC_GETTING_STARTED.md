# Getting Started with SLC Framework

> Build structured, hallucination-resistant software with LLMs.
> This guide walks you through everything — from prerequisites to shipping — using the SLC framework.

---

## ⚠️ Prerequisites (Required Before Anything Else)

Before you open `SLC.md` or `slc_universal_structure.md`, you must set up the following. SLC will not work properly without these.

---

### 1. Context7 MCP or Web Search Feature

SLC has a built-in rule that fetches the **latest documentation** for every library used in your project (FastAPI, Next.js, SQLModel, etc.) using Context7. Without Context7, the LLM will hallucinate outdated APIs.

**Install Context7 MCP** in your editor (VS Code / Cursor / Windsurf):

Add to your MCP config (`mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

Verify it's active — you should see `context7` listed in your MCP tools panel before proceeding. If you fail to set up the MCP server, you can use the IDE's native Web Search Tool with each prompt as a last resort — but this is manual and error-prone.

**Why this matters**: `SPEC.md` has a `must_read_latest` block that instructs the LLM to pull live docs via Context7 for every service in your stack. If Context7 is missing, that block is silently skipped and the LLM falls back to its training data — which may be months out of date.

---

### 2. A Consistent LLM

**Use the same LLM model throughout your entire project.** Switching models mid-way causes:

- Different interpretations of the same spec file
- Conflicting decisions that contradict `MEMORY.md`
- Drift from the original architecture

**Recommended models** (in order of quality for SLC):

- `claude-sonnet-4.5` to `4.6` / `claude-opus` — best for complex spec generation and long-context reasoning
- `gpt-5` — solid for task execution
- `gemini-3.0` to `3.0 pro` — good alternative

Avoid models smaller than 70B parameters for spec generation. Small models miss nuance and hallucinate constraints.

---

### 3. The Two SLC Files

You need both files in your project root before starting:

| File | Purpose |
|------|---------|
| `SLC.md` | The full SLC language specification — rules, syntax, block types, enforcement logic |
| `slc_universal_structure.md` | The universal folder/file structure every SLC project must follow |

Place them at the **root of your project**. These are the LLM's rulebook — they are referenced constantly.

---

### 4. Security: No Sensitive Data in Spec Files

SLC spec files are committed to version control (GitHub). Before you start, understand this rule:

**MUST NOT appear in any spec file:**
- Real names of admins, developers, or users
- API keys, secrets, tokens, passwords, credentials
- Internal hostnames, IPs, or infrastructure URLs
- PII (emails, phone numbers, addresses)

**Use instead:**
- Role placeholders: `{ADMIN}`, `{DEV_LEAD}`, `{USER}`
- Environment references: `{API_KEY}`, `{DB_HOST}`, `{SECRET}`

**Create a `.slc_secrets` file** (add to `.gitignore`) for real values that the LLM resolves locally. This file never gets pushed.

If a spec contains sensitive data, the LLM will emit a `SENSITIVE_DATA_LEAK` diagnostic. Treat it as a blocker.

---

## Step 1 — Write Your Requirements Document

Before you touch the LLM, write a **requirements document**. This is the single source of truth the LLM will use to generate your entire spec.

**What to name it:** `requirement.md` — place it at the project root alongside `SLC.md`.

The more detailed your requirements, the better your spec. A thin requirements document produces thin specs with gaps that the LLM fills with guesses.

**A good requirements document includes:**

```md
## Goal
What the app does in 2–3 sentences.

## User Journeys
Step-by-step flows for every type of user (regular user, admin, guest, etc.)

## Features
Every feature listed explicitly — do not assume the LLM will infer them.

## Tech Stack
- Frontend: (framework, language, styling approach, hosting)
- Backend: (framework, language, ORM, auth method, hosting)
- Database: (provider, type)
- Any third-party services (storage, email, payments, etc.)

## Design
- Color palette (hex codes)
- Font
- Design style (minimal, corporate, etc.)

## Non-Goals
Explicitly list what the app will NOT do.

## Constraints
Hard limits — things that must never be violated regardless of convenience.
```

**Rule of thumb:** If you wouldn't trust a junior developer to guess it, write it down. Vague requirements = hallucinated specs.

**Example of a bad vs good requirement:**

| Bad | Good |
|-----|------|
| "Users can log in" | "Users log in with email and password. JWT is issued on success, stored in an httpOnly cookie named `app_token`, expires in 24 hours." |
| "Admin panel" | "5 hardcoded admin emails. Admins can generate 1–100 one-time download keys. Non-admins are redirected to `/dashboard`." |
| "Download files" | "Download requires a one-time key redeemed via `POST /redeem`. After redemption a single-use UUID token (10 min TTL) is issued. The file is streamed from private Supabase Storage — the URL is never sent to the client." |

---

## Step 2 — Generate the Specs

Open your LLM with a **fresh conversation**. Use this exact prompt pattern:

---

### The Full Spec Generation Prompt

```
I am going to give you three files to read carefully. Do not miss a single point in any of them.

1. SLC.md — This is the SLC language and framework specification. Follow every rule in it exactly.
2. slc_universal_structure.md — This defines the universal folder and file structure every SLC project must follow. Your output must conform to it exactly.
3. requirement.md — This is the full requirements document for the app I want to build.

After reading all three files completely, generate the full spec for this project following SLC rules.

Apply the split file rule automatically:
- If ARCH, CONTRACT, or PLAN will exceed 4KB or contain 3+ distinct domains/modules, generate the split directory form (arch/, contract/, plan/) with index files. Otherwise generate the single-file form.

Generate:
- SPEC.md (entry point / global router — include must_read_latest for all services)
- CONTEXT.md (intent, user journeys, non-goals)
- CONSTRAINTS.md (tech stack, hard rules)
- SECURITY.md (security laws + REDACTION RULES section)
- MEMORY.md (decisions D1, D2... with dates and rationale — use {ROLE} placeholders, no real names)
- backend_specs/ARCH.md OR backend_specs/arch/ with arch_index.md + per-module files
- backend_specs/CONTRACT.md OR backend_specs/contract/ with contract_index.md + per-domain files
- backend_specs/PLAN.md OR backend_specs/plan/ with plan_index.md + per-phase files
- backend_specs/tasks/task_index.md (all task IDs and statuses)
- backend_specs/tasks/phases/ (one file per task — definition only, no status field)
- frontend_specs/ARCH.md OR frontend_specs/arch/ (state shape, routing, components — derived from backend CONTRACT)
- frontend_specs/CONTRACT.md OR frontend_specs/contract/ (mirrors backend contract structure exactly)
- frontend_specs/PLAN.md OR frontend_specs/plan/
- frontend_specs/tasks/task_index.md
- frontend_specs/tasks/phases/ (one file per task)

Rules:
- Do not generate any code.
- Do not make assumptions — if something is not in the requirements, flag it and ask before proceeding.
- No sensitive data in any spec file. Use {PLACEHOLDER} format.
- task_index.md is the ONLY place that tracks task status. Individual task files carry no status field.
- Frontend must derive from backend CONTRACT — it may not invent endpoints.

[PASTE requirement.md content here]
[PASTE SLC.md content here]
[PASTE slc_universal_structure.md content here]
```

> **Important:** Paste the actual file contents inline — do not attach files unless your LLM interface supports proper file reading. Many interfaces truncate attachments.

---

### The Backend-Only Beginning Prompt

Use this when you want to generate backend specs first, then frontend separately.

```
Read the following three files carefully. Do not miss a single point.

1. SLC.md — SLC language specification. Follow every rule exactly.
2. slc_universal_structure.md — Universal project structure. Your output must conform to it.
3. requirement.md — Full requirements for this project.

Generate ONLY the backend spec files:

- SPEC.md (global router — include must_read_latest block for all backend services)
- CONTEXT.md
- CONSTRAINTS.md
- SECURITY.md (include REDACTION RULES section)
- MEMORY.md (use {ROLE} placeholders only — no real names)
- backend_specs/ARCH.md OR backend_specs/arch/ (split if >4KB or 3+ modules)
  - If split: generate arch_index.md + one file per module
  - Each module file: data_model with typed fields, flows, boundaries
- backend_specs/CONTRACT.md OR backend_specs/contract/ (split if >10 endpoints or >5KB)
  - If split: generate contract_index.md + one file per domain
  - Each domain file: full endpoint schemas with request/response/error codes
- backend_specs/PLAN.md OR backend_specs/plan/ (split if >5 phases or >4KB)
- backend_specs/tasks/task_index.md (all tasks with status: todo — this is the ONLY status location)
- backend_specs/tasks/phases/ (one .md per task — no status field in individual task files)

Apply these rules:
- No code generation.
- No assumptions — flag anything missing and ask.
- No sensitive data. Use {PLACEHOLDER} tokens.
- Every TASK must have depends_on pointing to the relevant arch/ or contract/ section.
- Every TASK must have acceptance_criteria.
- MEMORY.md decisions use format: D1, D2... with date and rationale.

[PASTE requirement.md content here]
[PASTE SLC.md content here]
[PASTE slc_universal_structure.md content here]
```

---

### The Frontend Beginning Prompt

Use this **after** backend specs are fully generated and approved. Frontend derives from backend — never the reverse.

```
Read the following files carefully. Do not miss a single point.

1. SLC.md — SLC language specification.
2. slc_universal_structure.md — Universal project structure.
3. requirement.md — Full project requirements.
4. backend_specs/CONTRACT.md (or backend_specs/contract/contract_index.md + relevant domain files if split) — this is the AUTHORITATIVE source for all API contracts. Frontend must not invent endpoints.

Generate ONLY the frontend spec files:

- frontend_specs/ARCH.md OR frontend_specs/arch/ (split if >3 modules or >4KB)
  - If split: arch_index.md + per-module files
  - Each module: state shape, component tree, rendering strategy, routing
- frontend_specs/CONTRACT.md OR frontend_specs/contract/ (must MIRROR backend contract structure)
  - Same domain names and file names as backend contract
  - Defines how frontend consumes each endpoint: request construction, response handling, error states
  - Any mismatch with backend CONTRACT must be flagged as CONTRACT_MISMATCH — do not invent
- frontend_specs/PLAN.md OR frontend_specs/plan/
- frontend_specs/tasks/task_index.md
- frontend_specs/tasks/phases/ (one .md per task — no status field in individual task files)

Rules:
- No code generation.
- No API invention. Every endpoint used must exist in backend CONTRACT.
- Every TASK must reference the relevant frontend arch/ section and backend contract/ section via depends_on.
- Every TASK must have acceptance_criteria.
- No sensitive data. Use {PLACEHOLDER} tokens.
- task_index.md is the ONLY file that tracks task status.

[PASTE requirement.md content here]
[PASTE SLC.md content here]
[PASTE slc_universal_structure.md content here]
[PASTE backend_specs/CONTRACT.md or contract_index.md + relevant domain files here]
```

---

### What Good Spec Output Looks Like

- Every file has `@block` / `@end` SLC syntax
- `SPEC.md` has a `must_read_latest` block listing all services with Context7 URL hints
- `MEMORY.md` has numbered decisions (D1, D2...) with rationale, dates, and `{ROLE}` placeholders — never real names
- `SECURITY.md` has a `## REDACTION RULES` section
- **If split mode used**: `arch_index.md`, `contract_index.md`, and `plan_index.md` are present. Each has a clean one-line summary per module/domain/phase.
- **Each arch/{module}.md**: has `data_model` with typed fields, `flows`, and `boundaries`
- **Each contract/{domain}_api.md**: has every endpoint with ID (AUTH-01, DASH-01...), full request/response schema, and all error codes. `depends_on` points to the corresponding arch section.
- **Individual task files**: have `acceptance_criteria`, `depends_on` pointing to specific arch/contract sections, **no `status` field**
- **`task_index.md`**: is the only file that carries task `status`
- No real names, emails, credentials, or IPs anywhere in spec files

If any of these are missing, prompt: *"The spec is missing [X]. Please generate it following SLC rules."*

---

## Step 3 — Execute Tasks via SPEC.md

Once your specs are saved to disk, **every new conversation with the LLM starts the same way:**

### The Execution Prompt

```
Read SPEC.md first. It is the entry point for this project.

Follow the read_order in SPEC.md exactly — do not skip any file.

Use Context7 to fetch the latest documentation for every service listed in must_read_latest.

Load all HOT tier index files once:
- task_index.md
- arch_index.md (if arch/ directory exists)
- contract_index.md (if contract/ directory exists)

After reading all spec files, execute task [TASK_ID] from the task index.

Before executing the task:
1. Read the individual task file
2. Resolve depends_on — load only the specific arch/ and contract/ section files referenced
3. Do not load all arch or contract sections — only the ones in depends_on
4. Validate all dependencies are satisfied
5. Call Context7 for any library docs needed
6. Execute
7. Update task_index.md status to done
```

**Why always start with `SPEC.md`?**
`SPEC.md` is the global router. It contains the `read_order` — a strict sequence of files the LLM must read before touching any code. Skipping it means the LLM starts without knowing your constraints, security rules, decisions, or architecture. It will hallucinate.

**Memory tier loading order:**

| Tier | Files | When |
|------|-------|------|
| **HOT** | `SPEC.md`, all `*_index.md` files | Once per session |
| **WARM** | Individual task files, arch/ sections, contract/ sections | On-demand per task via `depends_on` |
| **COLD** | `CONTEXT.md`, `CONSTRAINTS.md` | Only when specs change |

**Token cost per task** (with split files): ~6–10KB total context vs 80–100KB for monolithic files = ~90% reduction that stays constant as the project scales.

**Execute tasks one at a time.** Don't batch multiple tasks in a single prompt — the LLM loses track of acceptance criteria and dependency checks.

---

## Step 4 — Keeping Specs in Sync

The LLM will not automatically update your spec files as the project evolves. You must explicitly prompt it.

### When to Update Specs

| Situation | Files to update |
|-----------|----------------|
| A new technical decision was made | `MEMORY.md` — add a new `D{n}` decision entry |
| An API endpoint changed shape | `backend_specs/CONTRACT.md` or `contract/{domain}_api.md` + `frontend_specs/CONTRACT.md` or `contract/{domain}_api.md` |
| A new table or model was added | `backend_specs/ARCH.md` or `arch/{module}.md` + update `arch_index.md` if split |
| A new API domain was added (split mode) | New `contract/{domain}_api.md` + update `contract_index.md` |
| A new module was added (split mode) | New `arch/{module}.md` + update `arch_index.md` |
| A component was added | `frontend_specs/ARCH.md` or `frontend_specs/arch/{module}.md` |
| A file crosses the 4KB threshold | Split it: create `{name}_index.md` + section files, update `SPEC.md` read_order |
| A bug revealed a wrong assumption | `MEMORY.md` (update the assumption) |
| Security rule was tightened | `SECURITY.md` |
| A constraint changed | `CONSTRAINTS.md` |

### The Update Prompt

```
The following change was made during task execution:
[describe what changed]

Update the following spec files to reflect this accurately:
- [list the files]

If any split index file (arch_index.md, contract_index.md) was affected, update the summary line for the changed section.
Follow SLC rules. Do not change anything unrelated to this update.
Do not add sensitive data. Use {PLACEHOLDER} format for any new values.
```

**Do not let spec drift accumulate.** If `MEMORY.md` gets out of sync with reality, future LLM sessions will make decisions based on stale facts — and errors compound.

---

## Step 5 — Extending Scope

If you want to add new features after the initial tasks are complete, follow this exact process. **Do not ask the LLM to add tasks informally** — that bypasses SLC's scope control.

### The Scope Extension Process

1. **Update `requirement.md`** — add the new feature with the same level of detail as your original requirements

2. **Tell the LLM explicitly:**

```
I have updated requirement.md with a new feature: [brief description].

Read the updated requirement.md and the current SPEC.md read_order files.

Extend the scope by:
1. Updating CONTEXT.md with the new user journey steps
2. Updating CONSTRAINTS.md if new tech is involved
3. Updating ARCH.md or the relevant arch/{module}.md with new data models or control flows
   - If a new module crosses the 3-domain threshold, create a new arch/{module}.md and update arch_index.md
4. Adding new endpoints to CONTRACT.md or contract/{domain}_api.md
   - If a new domain is added, create contract/{domain}_api.md and update contract_index.md
5. Creating new task files for the additional work
6. Updating task_index.md with the new task IDs

Do not modify existing completed tasks.
Do not add sensitive data — use {PLACEHOLDER} format.
```

**Never ask for "just one more thing" informally.** Informal additions create undocumented features that break the spec's integrity and cause hallucinations in future sessions.

---

## Step 6 — Fixing Issues

When something breaks during execution, fixing it **does not require updating the spec** — unless the fix changes the architecture or a decision.

### Simple Bug Fix (no spec change needed)

```
Task [X] was completed but there is a bug:
[describe the bug and the error]

Fix the bug. Do not change the architecture or any other behaviour.
Reference SECURITY.md and CONSTRAINTS.md to ensure the fix doesn't violate any rules.
```

### Bug That Reveals a Wrong Decision (spec change needed)

```
Task [X] was completed but we discovered that [decision D3] in MEMORY.md is wrong because:
[explain why]

The correct approach is: [explain the fix]

1. Fix the code for task [X]
2. Update MEMORY.md — amend decision D3 with the corrected decision and add a note explaining what changed and why
3. Check if ARCH.md or CONTRACT.md (or their split sections) need to be updated as a result
4. If the architecture changed, update the relevant arch/{module}.md and arch_index.md summary
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                       SLC WORKFLOW                              │
│                                                                 │
│  PREREQUISITES                                                  │
│  ├── Context7 MCP installed and active                          │
│  ├── Consistent LLM model chosen (don't switch)                 │
│  ├── SLC.md + slc_universal_structure.md in root                │
│  └── .slc_secrets in .gitignore (for sensitive values)          │
│                                                                 │
│  PHASE 1: SPEC GENERATION                                       │
│  ├── Write detailed requirement.md                              │
│  ├── Backend prompt: read 3 files → generate backend specs      │
│  │     Auto-split ARCH/CONTRACT/PLAN if >4KB or 3+ domains      │
│  ├── Frontend prompt: read 3 files + backend CONTRACT           │
│  │     Frontend mirrors backend contract structure exactly       │
│  └── Verify: index files present, no status in task files,      │
│       no sensitive data, all tasks have depends_on + criteria    │
│                                                                 │
│  PHASE 2: EXECUTION                                             │
│  ├── Every session: "Read SPEC.md first"                        │
│  ├── Load HOT tier once: all *_index.md files                   │
│  ├── Per task: load only depends_on sections (WARM tier)        │
│  ├── Execute one task at a time                                 │
│  └── Verify acceptance criteria before moving on               │
│                                                                 │
│  ONGOING                                                        │
│  ├── Changes → prompt LLM to update spec + index files          │
│  ├── New features → update requirement.md first                 │
│  ├── File crosses 4KB → split it, update SPEC.md read_order     │
│  └── Bugs → fix code (update spec only if decision changed)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|------------|-----|
| Skipping Context7 setup | Hallucinated API signatures | Install MCP before starting |
| Thin `requirement.md` | Specs full of guesses | Rewrite requirements in detail, regenerate specs |
| Switching LLM mid-project | Conflicting interpretations | Pick one model, stick to it |
| Not starting sessions with `SPEC.md` | LLM ignores constraints and security rules | Always prompt "Read SPEC.md first" |
| Asking for features without updating `requirement.md` | Undocumented scope creep | Update `requirement.md` → then extend spec |
| Not updating `MEMORY.md` after decisions | Future sessions make contradictory choices | Prompt spec update after every significant decision |
| Batching multiple tasks | LLM loses track of acceptance criteria | One task per conversation |
| Putting status in individual task files | Duplicate state, sync bugs | Only `task_index.md` tracks status |
| Loading all arch/contract sections for every task | Wasted context window, ~90% token waste | Use `depends_on` — LLM loads only referenced sections |
| Real names or credentials in spec files | Sensitive data pushed to GitHub | Use `{PLACEHOLDER}` + `.slc_secrets` (gitignored) |
| Manually editing split section files without updating the index | Stale index, LLM navigates to wrong section | Always update `*_index.md` when section changes |

---

*SLC Framework — Getting Started Guide*
