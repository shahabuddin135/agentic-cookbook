# contract/agent_api.md — Agent API Contract (WARM)

```slc
@block CONTRACT agent_api
priority: critical
intent: "Chat endpoint — POST to AI agent, receive SSE stream with RecipeCard"
scope: module
depends_on: [arch/agent.agent_module]

content:
  router_prefix: "/api/agent"

  POST /chat:
    auth: required
    rate_limit: "10 requests per user per minute (429 on breach)"
    request:
      method: POST
      path: "/api/agent/chat"
      headers:
        Authorization: "Bearer <jwt>"
        Content-Type: "application/json"
      body:
        message: "string — required, natural-language recipe request"
        conversation_id: "string | null — optional; omit to start new conversation"
    response:
      media_type: "text/event-stream"
      headers:
        Cache-Control: "no-cache"
        Connection: "keep-alive"
        X-Accel-Buffering: "no"
      event_sequence:
        1: "data: {\"type\": \"recipe\", \"data\": RecipeCardData, \"conversation_id\": \"uuid\", \"message_id\": \"uuid\"}\n\n"
        2: "data: {\"type\": \"done\"}\n\n"
        on_error: "data: {\"type\": \"error\", \"message\": \"string\"}\n\n"
    errors:
      401: "Missing or invalid JWT"
      422: "Missing required field: message"
      429: "Rate limit exceeded — Retry-After: 60 header included"

  RecipeCardData:
    message: "string — friendly intro sentence"
    recipe:
      title: "string"
      description: "string | null"
      prep_time: "string | null"
      cook_time: "string | null"
      servings: "int | null"
      ingredients: "[string]"
      instructions: "[string]"
      tags: "[string] | null"
      source_url: "string | null"
    image: "object | null"
    image_fields:
      url: "string"
      alt: "string"
      photographer: "string — REQUIRED (Pexels ToS)"
      photographer_url: "string"
@end
```
