# arch_index.md — Backend Architecture Registry (HOT)

> Load once per session. Maps module IDs to files. Load only the section relevant to current task.

```slc
@block INDEX arch_registry
priority: critical
intent: "Architecture module registry — load section by depends_on match, never all at once"
scope: global
failure_if_skipped: true

content:
  total_modules: 6

  modules:
    - id: "database"
      file: "arch/database.md"
      summary: "Async Neon connection, SQLModel engine, AsyncSessionDep injection"
      models: [AsyncSession, AsyncSessionDep]

    - id: "auth"
      file: "arch/auth.md"
      summary: "JWKS fetch+cache (1h TTL), JWT RS256 decode, get_current_user dependency"
      models: [HTTPBearer, HTTPAuthorizationCredentials]

    - id: "agent"
      file: "arch/agent.md"
      summary: "OpenAI Agents SDK, LiteLLM→Gemini 2.5 Flash, Apify+Pexels MCP, Runner.run()"
      models: [Agent, MCPServerSse, MCPServerStdio, Runner]

    - id: "conversations"
      file: "arch/conversations.md"
      summary: "Conversation + Message SQLModel tables, ownership-checked CRUD router"
      models: [Conversation, Message]

    - id: "profile"
      file: "arch/profile.md"
      summary: "User profile read/update, GDPR data export + 30-day deletion queue"
      models: [DataDeletionRequest]

    - id: "compliance"
      file: "arch/compliance.md"
      summary: "ConsentLog model, optional-auth consent router, IP SHA-256 anonymization"
      models: [ConsentLog]
@end
```
