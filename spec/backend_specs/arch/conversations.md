# arch/conversations.md — Conversations Module (WARM)

```slc
@block ARCH conversations_module
priority: critical
intent: "Conversation + Message models and CRUD — user chat session persistence"
scope: module
depends_on: [arch/database.database_module, arch/auth.auth_module]

content:
  files:
    - "backend/app/models/conversation.py"
    - "backend/app/models/message.py"
    - "backend/app/routers/conversations.py"

  data_model:
    Conversation:
      tablename: "conversation"
      fields:
        id: "str — UUID PK, default=str(uuid4())"
        user_id: "str — indexed (FK ref to Better Auth user.id, no SQLModel FK constraint)"
        title: "Optional[str] = None (first 60 chars of first user message)"
        created_at: "datetime — default=datetime.utcnow"
        updated_at: "datetime — default=datetime.utcnow"

    Message:
      tablename: "message"
      fields:
        id: "str — UUID PK, default=str(uuid4())"
        conversation_id: "str — indexed"
        role: "str — 'user' | 'assistant'"
        content: "str — plain text (intro sentence for assistant)"
        image_url: "Optional[str] = None (Pexels photo URL, assistant only)"
        metadata_: "Optional[dict] — sa_column=Column('metadata', JSONB) — full RecipeCard JSON"
        created_at: "datetime — default=datetime.utcnow"

  flows:
    create_conversation: >
      id = str(uuid4())
      conv = Conversation(id=id, user_id=user_id, title=message[:60])
      db.add(conv); await db.commit()

    save_user_message: >
      msg = Message(id=str(uuid4()), conversation_id=conv_id, role='user', content=message)
      db.add(msg); await db.commit()

    save_assistant_message: >
      msg = Message(id=str(uuid4()), conversation_id=conv_id, role='assistant',
                    content=parsed.message, image_url=parsed.image.url if parsed.image else None,
                    metadata_=parsed_dict)
      db.add(msg); await db.commit()

    list_conversations: >
      SELECT * FROM conversation WHERE user_id=? ORDER BY updated_at DESC

    get_conversation: >
      SELECT conversation WHERE id=? AND user_id=? (404 if not found)
      SELECT messages WHERE conversation_id=? ORDER BY created_at ASC

    delete_conversation: >
      db.delete(conv) — cascades to messages

  boundaries:
    - "user_id ownership check on EVERY read and delete — 404 if mismatch"
    - "metadata_ python attribute maps to 'metadata' JSONB column (sa_column)"
    - "No FK constraint declared for user_id — Better Auth manages user table"
    - "Message delete cascades from Conversation delete"
    - "Pre-stream DB writes happen BEFORE first SSE yield — no partial state"
@end
```
