# contract/agent_api.md — Agent API (Frontend, DERIVED)

> Mirrors `backend_specs/contract/agent_api.agent_api`. Backend is authoritative.

```slc
@block CONTRACT frontend_agent_api
priority: critical
intent: "Client view of POST /api/agent/chat (SSE) + TS types"
scope: module
depends_on: [backend_specs/contract/agent_api, arch/chat.chat_module]

content:
  call:
    method: POST
    url: "${NEXT_PUBLIC_API_URL}/api/agent/chat"
    headers:
      Authorization: "Bearer <jwt>"
      Content-Type: "application/json"
    body:
      message: "string (required)"
      conversation_id: "string | null (omit to start new conversation)"
    transport: "raw fetch() — NOT TanStack Query (streaming response)"

  response_stream:
    media_type: "text/event-stream"
    parse: "ReadableStream + TextDecoder; split on '\\n\\n'; strip 'data: '; JSON.parse"
    events:
      recipe: '{ type: "recipe", data: RecipeCardData, conversation_id: string, message_id: string }'
      done: '{ type: "done" }'
      error: '{ type: "error", message: string }'

  ts_types:
    RecipeCardData: >
      { message: string;
        recipe: { title: string; description: string | null; prep_time: string | null;
                  cook_time: string | null; servings: number | null;
                  ingredients: string[]; instructions: string[];
                  tags: string[] | null; source_url: string | null };
        image: RecipeImage | null }
    RecipeImage: >
      { url: string; alt: string; photographer: string; photographer_url: string }

  errors:
    401: "invalid/expired JWT → refresh or redirect /sign-in"
    422: "missing message field"
    429: "rate limit (10/min/user) — Retry-After: 60; surface friendly message"

  ui_invariants:
    - "Display photographer + photographer_url whenever image is present (Pexels ToS)"
    - "Only recipe/done/error event types exist (MEMORY do_not_change)"
@end
```
