# arch/chat.md — Chat & Streaming Module (WARM)

```slc
@block ARCH chat_module
priority: critical
intent: "Chat page, SSE fetch streaming, chat-store, RecipeCard rendering"
scope: module
depends_on: [backend_specs/contract/agent_api]

content:
  contract_anchor:
    - "POST /api/agent/chat returns text/event-stream."
    - "Per MEMORY: EXACTLY two events on success — a 'recipe' event then a 'done' event. On failure an 'error' event. There is NO 'chunk' / token-by-token event."
    - "So 'streaming' here = open stream, await the single recipe event, then done. UI shows a skeleton until the recipe arrives."

  store:
    file: "store/chat-store.ts (Zustand 5)"
    state:
      - "status: 'idle' | 'streaming' | 'done' | 'error'"
      - "activeConversationId: string | null"
      - "pendingUserMessage: string | null   # optimistic echo of user input"
      - "streamedRecipe: RecipeCardData | null"
      - "errorMessage: string | null"
    actions:
      - "startStream(message), setRecipe(data, conversationId, messageId), finish(), fail(msg), reset()"

  streaming_hook:
    file: "hooks/use-chat.ts ('use client')"
    impl:
      - "raw fetch() POST to `${NEXT_PUBLIC_API_URL}/api/agent/chat` with Authorization: Bearer <jwt>"
      - "body: { message, conversation_id?: activeConversationId }"
      - "read response.body via ReadableStream reader + TextDecoder"
      - "buffer text, split on '\\n\\n', strip 'data: ' prefix, JSON.parse each event"
      - "switch on event.type: 'recipe' → setRecipe + capture conversation_id/message_id; 'done' → finish(); 'error' → fail(message)"
      - "on 429 → surface rate-limit message (Retry-After: 60)"
    note: "On first message of a NEW chat, server returns a conversation_id — push route to /chat/{id} and invalidate conversations query."

  components:
    recipe_card:
      file: "components/recipe-card.tsx"
      renders:
        - "intro message"
        - "recipe: title, description, prep_time, cook_time, servings, ingredients[], instructions[], tags[], source_url"
        - "image (next/image, remote Pexels host) WITH REQUIRED attribution: photographer + photographer_url (Pexels ToS — non-negotiable)"
      skeleton: "components/recipe-card-skeleton.tsx — shown while status === 'streaming'"
    input:
      file: "components/chat-input.tsx"
      lib: "@kokonutui/ai-input-search"
      behavior: "submit → use-chat.send(message); disabled while streaming"
    chat_page:
      file: "(app)/chat/page.tsx ('use client')"
      states: "empty (no messages) | streaming (skeleton) | result (RecipeCard) | error"

  boundaries:
    - "RecipeCard image MUST display photographer attribution (Pexels ToS)"
    - "Do not invent SSE event types beyond recipe/done/error (MEMORY do_not_change)"
@end
```
