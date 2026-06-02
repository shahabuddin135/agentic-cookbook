# SLC — Universal Project Structure Rule

> **Purpose**
> This document defines the **universal, project-agnostic SLC structure** that an LLM must follow to initiate, plan, and execute any software project using **Spec‑Driven Development**.
>
> This file is the **root behavioral contract** between humans and LLMs.
>
> If this file is present, the LLM must **strictly obey it**. If it is missing or violated, execution must abort.
>
> **Companion document**: `SLC.md` — defines the SLC syntax, semantics, block types, and parsing rules. This file (slc_universal_structure.md) is the **project behavioral contract** that *uses* SLC syntax defined there.

---

## 1. Core Philosophy (Non‑Negotiable)

SLC enforces the following truths:

1. **Specs come before code**
2. **Intent freezes before execution**
3. **Tasks are immutable once approved**
4. **Memory overrides creativity**
5. **Security overrides convenience**
6. **Frontend and backend derive from the same source of truth**

LLMs must not invent structure, APIs, models, or behavior outside what is explicitly defined.

---

## 2. Mandatory Root Structure

Every SLC‑compliant project MUST follow this root structure:

```
spec/
├── SPEC.md
├── CONTEXT.md
├── CONSTRAINTS.md
├── SECURITY.md
├── MEMORY.md                  # OR memory/ (split when >4KB)
│
├── backend_specs/
│   ├── ARCH.md                # Small projects: single file
│   ├── arch/                  # Large projects: split by module
│   │   ├── arch_index.md      #   HOT: module registry + summaries
│   │   ├── auth.md            #   WARM: per-module models + flows
│   │   ├── payments.md
│   │   └── notifications.md
│   │
│   ├── PLAN.md                # Small projects: single file
│   ├── plan/                  # Large projects: split by phase
│   │   ├── plan_index.md      #   HOT: phase registry
│   │   ├── phase_1.md
│   │   └── phase_2.md
│   │
│   ├── CONTRACT.md            # Small projects: single file
│   ├── contract/              # Large projects: split by domain
│   │   ├── contract_index.md  #   HOT: endpoint registry
│   │   ├── auth_api.md        #   WARM: per-domain endpoints
│   │   ├── products_api.md
│   │   └── orders_api.md
│   │
│   └── tasks/
│       ├── task_index.md      # HOT: Global task registry & router
│       └── phases/
│           ├── phase-1/       # Individual task files
│           ├── phase-2/
│           └── phase-N/
│
├── frontend_specs/
│   ├── ARCH.md | arch/        # Same split rules as backend
│   ├── PLAN.md | plan/
│   ├── CONTRACT.md | contract/
│   └── tasks/
│       ├── task_index.md
│       └── phases/
│           ├── phase-1/
│           └── phase-2/
```

**Split rule**: A file MUST be split into an indexed directory when it exceeds **4KB** OR contains **3+ distinct domains/modules**. Until that threshold, a single file is preferred (less overhead).

**Coexistence rule**: A project uses EITHER `ARCH.md` (single) OR `arch/` (split) — never both. Same for PLAN, CONTRACT, and MEMORY.

Any deviation must be explicitly approved by the user and recorded in `MEMORY.md`.

---

## 3. SPEC.md — Global Router (Entry Point)

### Responsibilities

`SPEC.md` is the **single entry point**. The LLM must read this file first.

It must define:
- Mandatory read order
- Execution rules
- Immutability constraints
- Approval gates

### Required Sections

```md
## READ ORDER (MANDATORY)
1. CONTEXT.md
2. CONSTRAINTS.md
3. SECURITY.md
4. MEMORY.md
5. backend/ARCH.md (or arch/arch_index.md if split)
6. frontend/ARCH.md (or arch/arch_index.md if split)
7. backend/CONTRACT.md (or contract/contract_index.md if split)

## EXECUTION RULES
- No code generation before ARCH files are finalized
- TASKS.md files are locked after user approval
- CONTRACT.md is authoritative
- Violations must abort execution
```

LLMs must not skip or reorder these steps.

---

## 4. CONTEXT.md — Intent Freezer

### Purpose

Defines **why the system exists** and **what it is not**.

### Rules

- Immutable unless user explicitly changes it
- No technical implementation details

### Required Sections

```md
## GOAL
<single clear objective>

## NON‑GOALS
- <explicit exclusions>
```

LLMs must reject features that violate NON‑GOALS.

---

## 5. CONSTRAINTS.md — Reality Anchor

### Purpose

Defines **hard limits**. These override all plans and tasks.

### Required Sections

```md
## TECH
- Language
- Frameworks

## SCALE
- Expected usage limits

## HARD RULES
- Non‑negotiable constraints
```

LLMs must not propose solutions outside these constraints.

---

## 6. SECURITY.md — Global Security Law

### Purpose

Defines security rules that apply to **all code**.

### Rules

- This file overrides convenience, speed, and creativity
- Violations must be explicitly reported

### Required Sections

```md
## BACKEND RULES
- <security principles>

## FRONTEND RULES
- <client‑side rules>

## API RULES
- <contract enforcement>
```

LLMs must refuse to generate insecure code.

### Sensitive Data Redaction (Non‑Negotiable)

Spec files created through SLC are designed to live in version control (e.g., GitHub). Therefore:

**MUST NOT appear in any spec file**:
- Real names of admins, developers, or users
- API keys, secrets, tokens, passwords, or credentials
- Internal hostnames, IPs, or infrastructure URLs
- PII (emails, phone numbers, addresses)
- Organization-internal details that are not public

**MUST use instead**:
- Role-based placeholders: `{ADMIN}`, `{DEV_LEAD}`, `{USER}`
- Environment references: `{API_KEY}`, `{DB_HOST}`, `{SECRET}`
- Generic descriptions: "the admin decided" → "{ADMIN_ROLE} decided"

**Secret storage**:
- A `.slc_secrets` file (added to `.gitignore`) MAY hold real values for local resolution
- Runners may resolve `{PLACEHOLDER}` tokens from `.slc_secrets` or environment variables at runtime

**SECURITY.md must include**:
```md
## REDACTION RULES
- No real names in any spec file
- No credentials or tokens in plain text
- No internal URLs or IPs
- Use {PLACEHOLDER} format for all sensitive values
```

**Diagnostics**: Parsers/runners SHOULD emit `SENSITIVE_DATA_LEAK` if known patterns are detected in spec content (e.g., email regex, AWS key format `AKIA...`, IP addresses, common secret key patterns).

---

## 7. MEMORY.md — Anti‑Hallucination Anchor

### Purpose

Defines **frozen facts and decisions**.

This file exists to prevent:
- Drift
- Contradictions
- Hallucinated changes

### Required Sections

```md
## DECISIONS
- <final decisions — use role placeholders, never real names>

## ASSUMPTIONS
- <explicit assumptions>

## DO NOT CHANGE
- <immutable facts>
```

**Redaction rule**: MEMORY.md entries MUST use role placeholders (`{ADMIN}`, `{DEV}`) instead of real names. Example: "{ADMIN} approved schema v2" — never "John approved schema v2".

If a conflict arises, MEMORY.md always wins.

---

## 8. Backend Rules (Authoritative)

### Splittable File Protocol

SLC uses an **index + sections** pattern for any spec file that grows beyond the split threshold (>4KB or 3+ domains). This is the same pattern used for tasks, now generalized.

**Pattern**:
- `{name}_index.md` — **HOT** tier. Loaded once per session. Contains one-line summaries and file paths for each section. Never contains full content.
- `sections/{name}_*.md` — **WARM** tier. Loaded on-demand. Each section is self-contained with its own SLC blocks.

**LLM behavior for split files**:
1. Load the index file
2. Match current task's `depends_on` to the relevant section(s)
3. Load ONLY those section files
4. Never load all sections at once unless explicitly instructed

**When a file doesn't need splitting**: keep it as a single `{NAME}.md`. The LLM loads it directly. No index overhead.

---

### backend/ARCH — Architecture

**Single-file mode** (`ARCH.md`): Use when ≤3 modules and file is <4KB.

Defines:
- Data models
- Control flow
- Boundaries

No tasks. No code.

**Split mode** (`arch/`): Use when >3 modules OR >4KB.

#### arch/arch_index.md (HOT)

```slc
@block INDEX arch_registry
priority: critical
intent: "Architecture module registry — load section by depends_on match"
scope: global
failure_if_skipped: true

content:
  total_modules: 5
  
  modules:
    - id: "auth"
      file: "arch/auth.md"
      summary: "User auth, JWT, roles, sessions"
      models: [User, Session, Role]
      
    - id: "payments"
      file: "arch/payments.md"
      summary: "Payment processing, refunds, invoices"
      models: [Payment, Refund, Invoice]
      
    - id: "products"
      file: "arch/products.md"
      summary: "Product catalog, categories, inventory"
      models: [Product, Category, Inventory]
@end
```

#### arch/{module}.md (WARM)

```slc
@block ARCH auth_module
priority: critical
intent: "Auth module — models, flows, boundaries"
scope: module
depends_on: none

content:
  data_model:
    - User:
        id: uuid
        email: string
        hashed_password: string
        role: enum[admin, user]
        created_at: timestamp
    - Session:
        id: uuid
        user_id: uuid
        token: string
        expires_at: timestamp

  flows:
    - login: "POST /auth/login → validate credentials → create session → return JWT"
    - logout: "POST /auth/logout → invalidate session"

  boundaries:
    - "Auth module NEVER accesses payment data directly"
    - "Role checks happen at middleware level"
@end
```

**Cross-reference rule**: Tasks use `depends_on: [arch/auth.auth_module]` to reference split ARCH sections. The LLM resolves this to load only `arch/auth.md`.

---

### backend/PLAN — Execution Phases

**Single-file mode** (`PLAN.md`): Use when ≤5 phases and file <4KB.

Defines:
- High‑level execution phases
- No implementation details

**Split mode** (`plan/`): Use when >5 phases OR >4KB.

#### plan/plan_index.md (HOT)

```slc
@block INDEX plan_registry
priority: high
intent: "Phase registry — all phases with summaries"
scope: global

content:
  total_phases: 5
  
  phases:
    - id: 1
      file: "plan/phase_1.md"
      name: "Foundation"
      summary: "Project setup, DB, auth scaffolding"
      
    - id: 2
      file: "plan/phase_2.md"
      name: "Core Entities"
      summary: "Products, orders, inventory models"
@end
```

#### plan/phase_{N}.md (WARM)

Self-contained phase description with milestones and task references.

---

### backend/CONTRACT — API Definitions

**Single-file mode** (`CONTRACT.md`): Use when ≤10 endpoints and file <5KB.

Defines:
- API schemas
- Endpoints
- Payload shapes

This file is **authoritative** for frontend.

**Split mode** (`contract/`): Use when >10 endpoints OR >5KB.

#### contract/contract_index.md (HOT)

```slc
@block INDEX contract_registry
priority: critical
intent: "API contract registry — endpoint index by domain"
scope: global
failure_if_skipped: true

content:
  total_endpoints: 42
  
  domains:
    - id: "auth"
      file: "contract/auth_api.md"
      endpoints: 5
      summary: "Login, logout, register, refresh, me"
      
    - id: "products"
      file: "contract/products_api.md"
      endpoints: 8
      summary: "CRUD products, search, categories"
      
    - id: "orders"
      file: "contract/orders_api.md"
      endpoints: 12
      summary: "Cart, checkout, order history, refunds"
@end
```

#### contract/{domain}_api.md (WARM)

```slc
@block CONTRACT auth_api
priority: critical
intent: "Auth API endpoints — schemas and payloads"
scope: module
depends_on: [arch/auth.auth_module]

content:
  base_path: "/api/v1/auth"
  
  endpoints:
    - POST /login:
        request: { email: string, password: string }
        response: { access_token: string, token_type: string }
        errors: [401, 422]
        
    - POST /register:
        request: { email: string, password: string, name: string }
        response: { id: uuid, email: string }
        errors: [409, 422]
        
    - POST /logout:
        auth: required
        response: { message: string }
@end
```

**Frontend derivation rule**: Frontend `contract/` MUST mirror backend `contract/` structure exactly. Same domain names, same file names. Any mismatch → `CONTRACT_MISMATCH` diagnostic.

---

### backend_specs/tasks/ — Individual Task File System

**Purpose**: Maximum granularity and context efficiency with individual task files.

**Problem**: Even phase-based files require loading entire phase context when only one task is needed.

**Solution**: Individual task files with global index for routing.

---

#### Directory Structure

```
tasks/
├── task_index.md              # HOT: Global registry + SINGLE SOURCE OF TRUTH for status
└── phases/
    ├── phase-1/
    │   ├── 1.1_init_project.md    # Task definition only (no status)
    │   ├── 1.2_project_structure.md
    │   └── ...
    ├── phase-2/
    ├── phase-3/
    ├── phase-4/
    └── phase-5/
```

---

#### tasks/task_index.md (HOT)

**Authority**: Global task registry — lists ALL tasks at once.

**Key Rule**: Tasks are NOT locked. All visible from start.

**Responsibilities**:
- List ALL tasks across ALL phases with status
- Track current execution position
- Route to individual task files
- NO iteration needed — full visibility

**Required Structure**:

```slc
@block INDEX task_registry
priority: critical
intent: "Global task registry - all tasks visible"
scope: global
failure_if_skipped: true

content:
  total_tasks: 55
  total_estimate: 810
  
  phases:
    - phase: 1
      name: "Foundation"
      dir: "phases/phase-1/"
      tasks: 11
      estimate: 120
      
    - phase: 2
      name: "Core Entities"
      dir: "phases/phase-2/"
      tasks: 16
      estimate: 240

  all_tasks:
    # Phase 1
    - id: "1.1"
      file: "phases/phase-1/1.1_init_project.md"
      status: todo
    - id: "1.2"
      file: "phases/phase-1/1.2_project_structure.md"
      status: todo
    # ... all tasks listed
@end
```

**Execution Rule**: LLM reads `task_index.md` once, sees all tasks, loads only the individual task file needed.

---

#### phases/phase-N/X.X_task_name.md (WARM)

**Purpose**: Single task in isolated file.

**Benefits**:
- Load only ~1-2KB per task execution
- No parsing overhead
- Clean git history per task
- No duplicate status — `task_index.md` is the single source of truth for status

**Required Structure**:

```slc
@block TASK 1.1_init_project
priority: critical
intent: "Initialize FastAPI project with UV package manager"
scope: phase-1
depends_on: none
estimate: 10

content:
  - Create project directory: backend/
  - Initialize with: uv init
  - Create pyproject.toml with dependencies
  
acceptance_criteria:
  - pyproject.toml exists with all dependencies
  - UV package manager working
@end
```

**File Naming**: `{phase}.{task_number}_{snake_case_name}.md`

---

#### phases/phase-N/_summary.md

**Purpose**: Phase overview and progress tracking.

**Required Structure**:

```slc
@block PHASE phase_1_summary
priority: high
intent: "Phase 1 overview and progress"
scope: phase-1

content:
  name: "Foundation"
  description: "Project setup, database, authentication"
  total_tasks: 11
  estimate: 120
  completed: 0
  
  task_order:
    - 1.1_init_project
    - 1.2_project_structure
    - 1.3_env_config
    # ... all tasks in order
@end
```

---

#### Memory Tier Strategy

| Tier | Files | Load Frequency | Size Target |
|------|-------|----------------|-------------|
| **HOT** | SPEC.md, all `*_index.md` files | Once per session | <4KB each |
| **WARM** | Section files, individual tasks | On-demand per task | <4KB each |
| **COLD** | CONTEXT.md, CONSTRAINTS.md | On change only | Any |

**Context Window Optimization (per task execution)**:
- Load SPEC.md once (~1-2KB)
- Load task_index.md once (~4-8KB)
- Load arch_index.md once (~2KB)
- Load contract_index.md once (~2KB)
- Load individual task file (~1-2KB)
- Load relevant ARCH section (~2-4KB)
- Load relevant CONTRACT section (~2-4KB)
- **Total per task: ~6-10KB** vs loading everything: ~80-100KB = **~90% reduction**

**Scaling**: As the project grows, the per-task cost stays ~6-10KB because you only load the relevant sections. The index files grow slightly but remain summaries.

---

#### Migration from Legacy TASKS.md

**If TASKS.md exists**:
1. Read TASKS.md
2. Create phases/ directory structure
3. Extract each `@block TASK` to individual file
4. Generate task_index.md with all tasks
5. Create _summary.md per phase
6. Delete legacy TASKS.md
7. Update SPEC.md to point to task_index.md

---

---

## 9. Frontend Rules (Derived)

Frontend MUST derive from backend `CONTRACT.md` (or `contract/` if split).

### frontend_specs/ARCH.md

Defines:
- State shape
- UI flow
- Rendering logic

No API invention allowed.

---

### frontend_specs/PLAN.md & tasks/

Same rules as backend, but:
- Tasks must align with backend contracts
- Any mismatch must be reported
- Uses same phase‑based task structure

---

## 10. Execution Protocol (LLM Behavior)

LLM must follow this loop:

1. Read SPEC.md
2. Read files in declared order
3. Validate MEMORY + SECURITY
4. Finalize ARCH files
5. Generate task files (phase‑by‑phase)
6. Create task_index.md
7. Ask for user approval
8. Lock task_index
9. **Execute tasks via router**:
    - Read task_index.md
    - Load only current phase file
    - Execute next task
    - Update task_index.md status
    - If phase complete, move to archive
    - Unlock next phase

Skipping steps is forbidden.

---

### Task Execution Loop (Detailed)

```
while (tasks_remaining):
  1. Read task_index.md
  2. Get current_task and next_task_file
  3. Load individual task file (warm tier)
  4. Resolve depends_on → load only referenced ARCH/CONTRACT sections (warm tier)
  5. Validate depends_on satisfied
  6. **Call Context7 MCP for any service/stack docs before implementation**
  7. Execute task content
  8. Mark task.status = done in task_index.md
  9. Continue to next task
```

This loop ensures:
- Only relevant context loaded
- Clear execution state
- Auditable history
Skipping steps is forbidden.

---

## 11. Change Protocol

If the user requests changes:

- CONTEXT change → full re‑evaluation
- CONSTRAINTS change → architecture re‑validation
- TASKS change after lock → must unlock explicitly

Changes must be recorded in MEMORY.md.

---

## 12. Dynamic Adaptation Rules

This structure is **universal**.

For different projects:
- Languages change via CONSTRAINTS.md
- Architecture changes via ARCH.md
- Scope changes via CONTEXT.md

The structure itself does NOT change.

---

## 13. Violation Handling

If any rule is violated, the LLM must:

1. Stop execution
2. Report the violation
3. Reference the violated file + rule
4. Ask for correction

Silent correction is forbidden.

---

## 14. Final Authority Rule

If multiple files conflict:

1. SPEC.md
2. MEMORY.md
3. SECURITY.md
4. CONSTRAINTS.md
5. ARCH.md
6. PLAN.md
7. TASKS.md

Higher authority always wins.

---

## 15. Closing Statement

This document is **the law**.

Any LLM operating in an SLC‑based project must behave as a deterministic executor, not a creative assistant.

Failure to comply invalidates all outputs.

---

*End of Universal SLC Structure Rule*

