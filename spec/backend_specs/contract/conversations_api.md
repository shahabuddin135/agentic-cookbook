# contract/conversations_api.md — Conversations API Contract (WARM)

```slc
@block CONTRACT conversations_api
priority: high
intent: "Conversation CRUD endpoints — list, get, delete with ownership enforcement"
scope: module
depends_on: [arch/conversations.conversations_module]

content:
  router_prefix: "/api/conversations"
  auth: required (all endpoints)

  GET /:
    description: "List all conversations belonging to current user"
    response:
      status: 200
      body:
        conversations: "Conversation[]"

  GET /{conversation_id}:
    description: "Get single conversation + all messages"
    response:
      status: 200
      body:
        conversation: "Conversation"
        messages: "Message[]"
    errors:
      404: "Conversation not found or belongs to another user"

  DELETE /{conversation_id}:
    description: "Delete conversation and all its messages"
    response:
      status: 204
      body: null
    errors:
      404: "Conversation not found or belongs to another user"

  Conversation:
    id: "string (uuid)"
    user_id: "string"
    title: "string | null"
    created_at: "string (ISO 8601)"
    updated_at: "string (ISO 8601)"

  Message:
    id: "string (uuid)"
    conversation_id: "string"
    role: "'user' | 'assistant'"
    content: "string"
    image_url: "string | null"
    metadata: "object | null (full RecipeCard JSON for assistant messages)"
    created_at: "string (ISO 8601)"
@end
```
