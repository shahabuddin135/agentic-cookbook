# arch/conversations.md — Conversations Module (WARM)

```slc
@block ARCH conversations_module
priority: high
intent: "Conversation history list, detail view, TanStack Query caching/invalidation"
scope: module
depends_on: [backend_specs/contract/conversations_api]

content:
  contract_anchor:
    - "GET /api/conversations → { conversations: Conversation[] }"
    - "GET /api/conversations/{id} → { conversation, messages: Message[] }"
    - "DELETE /api/conversations/{id} → 204"
    - "All require Bearer JWT; ownership enforced server-side (404 if other user)"

  query_hooks:
    file: "hooks/use-conversations.ts ('use client')"
    hooks:
      - "useConversations() → useQuery(['conversations']) — sidebar list"
      - "useConversation(id) → useQuery(['conversation', id]) — detail + messages"
      - "useDeleteConversation() → useMutation → on success invalidate ['conversations'] and route to /chat if active deleted"
    cache: "staleTime moderate; invalidate ['conversations'] after a new chat creates a conversation_id (from use-chat)"

  sidebar:
    file: "components/sidebar.tsx"
    renders: "conversation list (title or fallback 'New chat'), active highlight, delete affordance, 'New chat' button → /chat"
    empty_state: "prompt to start first conversation"

  detail_view:
    file: "(app)/chat/[id]/page.tsx"
    next16: "params is a Promise — `const { id } = await params` (Server Component) or `use(params)` (Client Component)"
    renders: "message timeline — user bubbles (content) + assistant RecipeCards (rebuilt from message.metadata RecipeCard JSON)"
    append: "submitting a new message in an existing conversation reuses use-chat with conversation_id=id; on done, invalidate ['conversation', id]"

  models_ref:
    Conversation: "{ id, user_id, title|null, created_at, updated_at }"
    Message: "{ id, conversation_id, role:'user'|'assistant', content, image_url|null, metadata|null, created_at }"
    note: "assistant message.metadata holds the full RecipeCard JSON → re-render via RecipeCard component"

  boundaries:
    - "Never fabricate conversation/message shapes — mirror conversations_api contract exactly"
    - "Deleting the active conversation routes the user back to /chat"
@end
```
