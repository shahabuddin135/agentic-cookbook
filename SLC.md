# SLC — Spec Language for Cognition

> **SLC (Spec Language for Cognition)**
>
> A compact, declarative, machine-first spec language designed to make LLMs and humans read, index, and act on project and system specifications with predictable, low-entropy instructions.
>
> This document is the canonical guide: syntax, semantics, parsing rules, edge cases, validation rules, and best practices for embedding SLC inside Markdown or using as standalone spec files.
>
> **Companion document**: `slc_universal_structure.md` — defines the project-level folder/file structure and behavioral contract that *uses* SLC syntax. This file (SLC.md) is the **syntax & semantics spec**; the structure doc is the **project behavioral contract**.

---

## 1. Goals & Rationale

SLC is built to solve real problems LLMs and teams face when using freeform docs:

- **Read-order ambiguity** — LLMs guess what to read first.
- **Weak priorities** — Important vs optional items are not explicit.
- **Implicit relationships** — "See file X" is ambiguous.
- **Token waste** — Long prose for structure increases cost.
- **Change sensitivity** — No clear diff or pinning semantics.

**Design principles**
- Declarative blocks with strict headers
- Explicit read routing and mandatory checks
- Lightweight, human-readable, machine-parseable
- Backwards-compatible with Markdown via fenced SLC blocks
- Fail-fast validation and clear error rules

---

## 2. File formats & embedding

SLC may be stored as:
- `.slc` — pure SLC file
- Markdown (`.md`) with fenced SLC blocks: ```` ```slc\n...\n``` ````
- Inline YAML/JSON is allowed for small `meta` blocks but SLC is the carrier format.

When embedded in Markdown, the SLC parser must only parse fenced blocks with language `slc` and ignore other prose unless the router explicitly points to it.

---

## 3. High-level structure

Every SLC file is a sequence of **Blocks**. Blocks are independent units the parser reads in order. Each block starts with `@block` and ends with `@end`.

Syntax example:

```
@block <BLOCK-TYPE> <BLOCK-NAME>
<attributes...>

content:
  <content lines>
@end
```

- `<BLOCK-TYPE>` is a token that categorizes the block (examples: `INDEX`, `PLAN`, `TASK`, `ARCH`, `INTENT`, `CONSTRAINTS`, `ROUTE`, `META`, `LINK`).
- `<BLOCK-NAME>` is an optional identifier used for cross-references. It must be unique within the file.

---

## 4. Block attributes (required fields)

Every block must include the following attributes (order-insensitive) unless the type defines overrides:

- `priority: <integer | keyword>` — integer or keyword. Canonical mapping:
  - `1` = `critical`
  - `2` = `high`
  - `3` = `medium`
  - `4` = `low`
  - `5` = `optional`
  
  Use keywords for readability; use integers for computed comparisons. Do not mix within the same project.
- `intent: "<short description>"` — single-line short purpose.
- `scope: <global|file|block|phase>` — how wide the block applies.
- `depends_on: [<file.block>, <file.otherblock>] | none` — explicit dependencies.
- `hash: <hex>` — optional: SHA-256 of `content` for change detection.
- `version: <semver>` — optional Semantic versioning for this block.

Example:

```
@block TASK create_todo
priority: critical
intent: "Create the add todo function"
scope: phase-1
depends_on: [ARCH.todo_model]

content:
  - Implement add_todo(title:str, desc:str)
@end
```

---

## 5. Special block types & semantics

### 5.1 INDEX
- Purpose: central router. **Every project using SLC must include exactly one `INDEX` block per root file.**
- Responsibilities:
  - `read_order`: explicit list of file.block or block names
  - `must_read_latest`: list of services or external docs to fetch at read time
  - `failure_if_skipped: true|false`

Example:

```
@block INDEX root_index
priority: critical
intent: "Reading router"
scope: global

read_order:
  - phase-1.INDEX
  - phase-1.plan
  - phase-1.arch
failure_if_skipped: true

content:
  short: "Router file — follow read_order exactly"
@end
```

### 5.2 ROUTE
- Used for intra-file or inter-file routing when nested flows exist.
- `conditions` may be specified to enable conditional reading.

### 5.3 PLAN
- High-level phases and milestones.
- Each plan entry must be atomic and reference tasks by id.

### 5.4 TASK
- Smallest actionable unit. Prefer single responsibility.
- Attributes:
  - `assignee` (optional)
  - `estimate` (optional, minutes)
  - `status` (todo|in-progress|done)

### 5.5 ARCH
- Architecture description. Must provide `data_model` blocks and `flow` blocks.
- `data_model` sub-blocks must have explicit typed fields.

### 5.6 LINK
- Explicit relation between two blocks. Fields:
  - `from: file.block`
  - `to: file.block`
  - `relation: <implements|depends|references|verifies>`

---

## 6. Primitives & data types

Basic scalar types:
- `string` — double-quoted for multi-word
- `int` — integer
- `float` — decimal
- `bool` — true|false
- `timestamp` — ISO8601

Collections:
- Arrays: `[a, b, c]`
- Maps: `{
    key: value
  }`

Typing rules:
- Use explicit types when defining `data_model` in `ARCH` blocks.
- Parsers must coerce but raise on ambiguous coercion.

---

## 7. Cross-file references & namespaces

References use the `file.block` URI. If `file` is omitted, the current file is assumed. Example: `ARCH.todo_model` references the `todo_model` block in the current file.

Parsers must detect unresolved references and return `UNRESOLVED_REFERENCE` diagnostics.

Circular dependencies are allowed **only** if declared: `depends_on: circular:true` and an explanation block follows.

---

## 8. Read order & routing enforcement

The `INDEX` block's `read_order` **must be followed strictly** by the LLM/CD system. If `failure_if_skipped: true` and a referenced block is missing or unreadable, the run must abort and report `MISSING_REQUIRED_BLOCK`.

`read_order` supports conditional entries:

```
read_order:
  - phase-1.index
  - if: env.debug == true -> phase-1.debug_plan
  - phase-1.plan
```

Condition evaluation rules: simple equality, boolean checks, exists checks. No Turing-complete expressions.

---

## 9. Anchors, pins & context versioning

**Anchors** allow pinning relevant context for future runs.

```
@block ANCHOR todo_schema_v1
priority: critical
intent: "Pin data model for todo"
scope: global
hash: abcd1234...

content:
  data_model: ARCH.todo_model
  timestamp: 2026-01-20T10:00:00Z
@end
```

- Anchors are immutable references for that `hash` and `timestamp`.
- Parsers must validate content against `hash` when `hash` is present.

**must_read_latest** in `INDEX` tells the runner to fetch service docs via Context7 MCP. Example:

```
must_read_latest:
  - service: "FastAPI"
    url_hint: "context7://fastapi"
  - service: "SQLModel"
    url_hint: "context7://sqlmodel"
  - service: "Groq"
    url_hint: "context7://groq"
  - service: "Cloudinary"
    url_hint: "context7://cloudinary"
```

**Context7 MCP Integration Rule**:
- Before implementing any service, framework, or library integration, the runner/LLM **MUST** call the Context7 MCP to resolve the library ID and fetch latest documentation
- This ensures implementations use current APIs and avoid deprecated patterns
- Pattern: `mcp_context7_resolve-library-id` → `mcp_context7_get-library-docs`

---

## 10. Error handling & diagnostics

When a parser/runner encounters an error it must produce structured diagnostics with codes:

- `SYNTAX_ERROR` — invalid block header or malformed attribute
- `UNRESOLVED_REFERENCE` — missing reference
- `MISSING_REQUIRED_BLOCK` — required by read_order or dependency
- `HASH_MISMATCH` — content hash mismatch
- `CIRCULAR_DEPENDENCY` — unexpected cycle
- `CONSTRAINT_VIOLATION` — runtime constraint breach

Diagnostics must include:
- `file`, `block`, `line`, `code`, `message`, `suggested_fix`

---

## 11. Versioning & change detection

Blocks may include `version` and `hash`. Version is semantic; hash is SHA-256 of canonicalized `content` block (no whitespace churn).

When merging upstream changes, the runner should:
1. Check `hash` — if same, no-op.
2. If different and `version` incremented — accept.
3. If different and `version` unchanged — mark `POTENTIAL_CONCURRENT_EDIT`.

---

## 12. Conditional & computed blocks

SLC supports limited `computed` blocks that are evaluated by the runner. These are NOT Turing-complete and must only use:
- simple arithmetic, string concat, boolean logic
- references to other blocks (read-only)

```
@block COMPUTED estimated_time
priority: optional
intent: "Sum task estimates"

expr: "sum(tasks.*.estimate)"
@end
```

Runners must evaluate and cache computed block results and include them in diagnostics if evaluation fails.

---

## 13. File splitting & large content

### 13.1 Split threshold

Any SLC-compliant spec file SHOULD be split into an indexed directory when it exceeds **4KB** OR contains **3+ distinct domains/modules**. Below that threshold, a single file is preferred to avoid overhead.

**Splittable files**: `ARCH`, `CONTRACT`, `PLAN`, `MEMORY`.
**Never split**: `CONTEXT`, `CONSTRAINTS` (these must remain small by design).

### 13.2 Index + sections pattern

When a file is split:
- `{name}_index.md` — contains an `INDEX` block listing all sections with one-line summaries and file paths. This is a **HOT** file (loaded once per session).
- `{name}_{section}.md` — self-contained section with its own SLC blocks. This is a **WARM** file (loaded on-demand).

A project uses EITHER `{NAME}.md` (single) OR `{name}/` (split directory) — never both.

### 13.3 Cross-references to split files

References to split sections use the path: `{dir}/{file}.{block}`. Example: `arch/auth.auth_module` resolves to the `auth_module` block inside `arch/auth.md`.

The LLM MUST resolve `depends_on` references to determine which section files to load. It MUST NOT load all sections when only one is needed.

### 13.4 Streaming for giant blocks

For content > 64k tokens:
- Block must include `streamable: true`
- The runner must support partial reads respecting `read_order` and `depends_on` semantics
- If streaming fails, return `STREAM_FAILURE` diagnostic

Large binary content (images, datasets) must be referenced via `uri:` fields and not embedded. Runners should optionally fetch them.

---

## 14. Security, signing & provenance

Blocks may include a `signature` field. Signatures should be detached and validated by the runner. Example:

```
signature:
  algorithm: ed25519
  key_id: {DEV_KEY_ID}
  sig: base64(...)
```

Provenance headers: `author`, `created_at`, `modified_by`, `modified_at` are recommended. Use role placeholders for `author` and `modified_by` (e.g., `{BACKEND_DEV}`) — never real names.

### 14.1 Sensitive data redaction

SLC spec files are expected to be committed to version control. All spec content MUST be free of:
- Real personal names, emails, or PII
- API keys, secrets, tokens, credentials
- Internal hostnames, IPs, or infrastructure URLs

Use `{PLACEHOLDER}` tokens (e.g., `{ADMIN}`, `{API_KEY}`, `{DB_HOST}`) that are resolved at runtime from `.slc_secrets` (gitignored) or environment variables.

Runners SHOULD detect and emit `SENSITIVE_DATA_LEAK` diagnostics for patterns matching emails, key prefixes (e.g., `AKIA`, `sk-`), IP addresses, or other credential formats.

---

## 15. Human-friendly features

- Friendly `short:` field for quick summaries
- `examples:` arrays for small code or CLI examples
- `notes:` for human-only hints (runners may ignore these if `ignore_notes: true`)

---

## 16. Compatibility with Markdown

Embed SLC inside Markdown using fenced code blocks. The parser must:
1. Extract ` ```slc ... ``` ` blocks in file read order
2. Parse them as SLC
3. If `INDEX` references top-level Markdown content (rare), treat that content as `TEXT.<slug>` block

This allows teams to keep human explanations and SLC anchors in the same doc.

---

## 17. Example: Phase-1 project (compact)

```
@block INDEX root
priority: critical
intent: "Router for phase-1"
scope: global
read_order:
  - phase-1.plan
  - phase-1.arch
  - phase-1.tasks
failure_if_skipped: true

content:
  short: "Start here"
@end

@block PLAN plan_v1
priority: high
intent: "Phase plan"

content:
  - p1: build core todo app
  - p2: tests & polish
@end

@block ARCH todo_model
priority: critical
intent: "Data model for todos"

content:
  fields:
    - id: string
    - title: string
    - desc: string
    - done: bool
@end

@block TASK add_todo
priority: critical
intent: "Implement add_todo"
depends_on: [ARCH.todo_model]

content:
  - create function add_todo
@end
```

---

## 18. Edge cases & how SLC handles them

This section lists edge cases and SLC behaviour.

1. **Unresolved reference** — Mark `UNRESOLVED_REFERENCE`, run abort if dependency critical.
2. **Circular dependency** — If undeclared, return `CIRCULAR_DEPENDENCY`. If declared, runner must still enforce an ordered evaluation where possible.
3. **Missing INDEX** — Project invalid. Runner must refuse to process.
4. **Conflicting versions** — `POTENTIAL_CONCURRENT_EDIT` diagnostic and require manual resolution.
5. **Large block >64k tokens** — Must set `streamable: true` or be rejected.
6. **Binary data embedded** — Forbidden; must be `uri:` referenced.
7. **Conditional route fails** — Skip optional but log `CONDITIONAL_ROUTE_SKIPPED`.
8. **Hash mismatch** — `HASH_MISMATCH` and require re-validation.
9. **Invalid computed expression** — `COMPUTED_EVAL_ERROR` and fallback to default values if present.
10. **Multiple INDEX blocks in root** — `INDEX_CONFLICT` — only one allowed per root.

---

## 19. Parsing algorithm (spec for implementers)

1. Read file bytes. If Markdown, extract ` ```slc` blocks.
2. Tokenize by lines. Identify `@block` start tokens.
3. For each block, parse attributes until `content:` anchor.
4. Canonicalize `content` (trim trailing spaces, normalize line endings) to calculate `hash`.
5. Build symbol table: `file.block -> block_meta`.
6. Validate references; produce diagnostics.
7. Evaluate `INDEX` read_order, resolve conditional entries.
8. Load blocks in read_order, streaming when `streamable`.
9. Evaluate computed blocks, validate constraints.
10. Emit structured object model for LLM consumption (JSON-LD compatible optional).

---

## 20. LLM consumption guide (how LLM should read SLC)

- **Step 0**: Read `INDEX` block. If `failure_if_skipped: true`, refuse unless INDEX present.
- **Step 1**: Follow `read_order` sequentially. Do not parallel-scan unless explicitly allowed.
- **Step 2**: For each block:
  - Respect `priority` — when summarizing or planning, highlight `critical` first.
  - Read `intent` first (first 1–2 lines). Use `content` only to implement.
- **Step 3**: Resolve `depends_on` before acting on a block.
- **Step 4**: Validate `hash` if present. If mismatch and `version` increased, accept; otherwise flag.
- **Step 5**: Use `LINK` blocks for causal relationships, not natural language heuristics.

**Recommended prompt pattern for LLM integrators** (short):

> "Read `INDEX` and follow `read_order`. For each block: read `intent`, then `content`. Enforce dependencies. Return a list of actions ordered by priority. Abort on `MISSING_REQUIRED_BLOCK` or `HASH_MISMATCH` unless instructed to continue."

---

## 21. Best practices

- Keep blocks small and focused.
- Use `TASK` for single actions (1–60 minutes).
- Use `PLAN` for milestones only.
- Put human explanations in `notes:` or in adjacent Markdown, not inside critical `content`.
- Always include `intent` and `scope`.
- Use `hash` for anchors you *care* about.
- Split files when they exceed 4KB or contain 3+ domains — use the index + sections pattern.
- Prefer single files for small projects — splitting adds overhead that isn't justified under 4KB.
- Use `depends_on` to link tasks to specific ARCH/CONTRACT sections so the LLM loads only what it needs.

---

## 22. Limitations & unanswered design choices

SLC defines a conservative, practical system. Unsolved/complex topics:

- **Full transactional merging across distributed authors** — SLC provides diagnostics but not a conflict resolution protocol.
- **Authenticated fetching of `must_read_latest` external docs** — runner integration points depend on environment.
- **Rich computed language** — SLC limits computing to deterministic, simple ops; complex logic must live in code, not spec.
- **Automatic embedding/indexing strategy** — SLC is format-level; embedding choices (vectors/hashes) are left to implementers.

These gaps are intentional: SLC favors determinism and predictability.

---

## 23. Roadmap & next steps

- v0.1: This spec — canonical guide and Markdown-embedded SLC.
- v0.2: Formal grammar (EBNF) and reference parser (Python).
- v0.3: Transpiler from SLC-in-Markdown to canonical JSON-LD and CI validators.
- v1.0: Ecosystem tools, editor plugins, and backward-compatible migration guides.

---

## 24. Appendix — Quick reference

- Block start: `@block TYPE NAME` (NAME optional)
- Block end: `@end`
- Required attrs: `priority`, `intent`, `scope`, `depends_on` (none allowed)
- Router: `INDEX` block with `read_order` mandatory
- Diagnostics codes: `SYNTAX_ERROR`, `UNRESOLVED_REFERENCE`, `MISSING_REQUIRED_BLOCK`, `HASH_MISMATCH`, `SENSITIVE_DATA_LEAK`

---

*End of SLC guide (v0.1)*

