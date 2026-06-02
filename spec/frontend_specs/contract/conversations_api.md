# contract/conversations_api.md — Conversations API (Frontend, DERIVED)

> Mirrors `backend_specs/contract/conversations_api.conversations_api`. Backend is authoritative.

```slc
@block CONTRACT frontend_conversations_api
priority: high
intent: "Client view of conversations CRUD + TS types"
scope: module
depends_on: [backend_specs/contract/conversations_api, arch/conversations.conversations_module]

content:
  base: "${NEXT_PUBLIC_API_URL}/api/conversations"
  auth: "Bearer JWT (all)"
  transport: "TanStack Query v5"

  endpoints:
    list:
      call: "GET /api/conversations"
      response: "{ conversations: Conversation[] }"
      hook: "useConversations() → queryKey ['conversations']"
    get:
      call: "GET /api/conversations/{id}"
      response: "{ conversation: Conversation, messages: Message[] }"
      hook: "useConversation(id) → queryKey ['conversation', id]"
      errors: { 404: "not found or not owned" }
    delete:
      call: "DELETE /api/conversations/{id}"
      response: "204 (no body)"
      hook: "useDeleteConversation() → invalidate ['conversations']"
      errors: { 404: "not found or not owned" }

  ts_types:
    Conversation: >
      { id: string; user_id: string; title: string | null;
        created_at: string; updated_at: string }
    Message: >
      { id: string; conversation_id: string; role: 'user' | 'assistant';
        content: string; image_url: string | null;
        metadata: RecipeCardData | null; created_at: string }

  ui_invariants:
    - "assistant message.metadata is the RecipeCardData JSON → render with RecipeCard"
    - "title may be null → fall back to 'New chat'"
@end
```
