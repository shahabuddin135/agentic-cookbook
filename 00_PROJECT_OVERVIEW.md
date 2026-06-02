# Agentic Cookbook — Project Overview

> An AI-powered recipe discovery app. Users type a natural language recipe request, the AI agent fetches a real recipe and a matching photo, and streams back a structured, beautiful result.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  Next.js App (App Router)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth Pages  │  │  Chat UI     │  │  Profile Page    │  │
│  │  sign-in     │  │  ai-input    │  │  simple profile  │  │
│  │  sign-up     │  │  recipe card │  │  + data export   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                 │
│  Better Auth Client       │                                 │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌─────────────────────────────────────┐
│  Next.js API     │  │         FastAPI Backend              │
│  /api/auth/[all] │  │                                     │
│  Better Auth     │  │  POST /api/agent/chat               │
│  JWT Plugin ─────┼──┼─► AI Agent (OpenAI Agents SDK)      │
│  JWKS Endpoint   │  │     LiteLLM → Gemini 2.5 Flash      │
└────────┬─────────┘  │     MCP: Apify Recipes Scraper       │
         │             │     MCP: Pexels Image Search         │
         │             │                                     │
         ▼             │  GET  /api/conversations            │
┌──────────────┐       │  DELETE /api/conversations/{id}    │
│ Neon Postgres│◄──────┤  GET  /api/profile/export (GDPR)   │
│              │       │  DELETE /api/profile (Erasure)     │
│  - user      │       │                                     │
│  - session   │       └─────────────────────────────────────┘
│  - account   │
│  - jwks      │
│  - conversation│
│  - message   │
│  - consent_log│
│  - deletion_req│
└──────────────┘
```

---

## Auth Flow (Better Auth → FastAPI via JWKS)

```
1. User signs in (or signs up) via Next.js (Better Auth)
2. Better Auth creates a session immediately — no email verification required
3. Better Auth issues a JWT (RS256, via jwt plugin) on demand
4. Better Auth exposes JWKS at /api/auth/jwks
5. Frontend stores JWT in memory / httpOnly cookie
6. Frontend sends: Authorization: Bearer <JWT> to FastAPI
7. FastAPI fetches + caches JWKS from Next.js
8. FastAPI verifies JWT signature (RS256) and extracts user_id
9. FastAPI queries Neon for user context → processes request
```

---

## Full Tech Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| **Frontend** | Next.js | 15.x (App Router) |
| **UI Library** | shadcn/ui + Tailwind CSS | Latest |
| **AI Input** | @kokonutui/ai-input-search | via shadcn CLI |
| **State** | Zustand | 5.x |
| **Server State** | TanStack Query (React Query) | v5 |
| **Auth (client)** | Better Auth client | Latest |
| **Package Manager** | Bun | Latest |
| **Backend** | FastAPI | 0.115.x |
| **Python** | Python | 3.11+ |
| **ORM** | SQLModel + asyncpg | Latest |
| **AI Agent** | openai-agents SDK | Latest |
| **LLM Proxy** | LiteLLM | Latest |
| **LLM Model** | Gemini 2.5 Flash | via LiteLLM |
| **MCP Tool 1** | Apify Recipes Scraper | Remote SSE via mcp-remote |
| **MCP Tool 2** | Pexels MCP Server | Local stdio via uv |
| **Auth (server)** | Better Auth | Next.js API routes + JWT plugin |
| **Database** | Neon PostgreSQL | Serverless Postgres |
| **JWKS Verify** | python-jose | FastAPI JWT validation |

---

## Data Flow — Recipe Request

```
User types: "give me a healthy Thai green curry"
     │
     ▼
Next.js sends POST /api/agent/chat
  { "message": "...", "conversation_id": "uuid" }
  Authorization: Bearer <JWT>
     │
     ▼
FastAPI verifies JWT → extracts user_id
     │
     ▼
OpenAI Agents SDK creates a run
  System: "You are a recipe assistant..."
  User: "give me a healthy Thai green curry"
     │
     ├──► Tool: apify_recipes_scraper("Thai green curry healthy")
     │         Returns: title, ingredients, steps, cook_time
     │
     └──► Tool: pexels_image_search("Thai green curry dish")
               Returns: image_url, photographer_credit
     │
     ▼
Agent composes structured response:
  { recipe: {...}, image: {...} }
     │
     ▼
FastAPI saves to DB (conversation + message rows)
FastAPI streams response to Next.js via SSE
     │
     ▼
Next.js renders RecipeCard with image + formatted recipe
```

---

## Page Routes (Frontend)

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing / redirect to chat | No |
| `/sign-in` | Sign in form | No (redirect if authed) |
| `/sign-up` | Sign up form | No (redirect if authed) |
| `/chat` | Main chat interface | Yes |
| `/chat/[id]` | Specific conversation | Yes |
| `/profile` | User profile + settings | Yes |
| `/privacy` | Privacy Policy | No |
| `/terms` | Terms of Service | No |

---

## API Endpoints (Backend FastAPI)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/agent/chat` | Send message to AI agent | JWT |
| GET | `/api/conversations` | List user conversations | JWT |
| GET | `/api/conversations/{id}` | Get conversation + messages | JWT |
| DELETE | `/api/conversations/{id}` | Delete a conversation | JWT |
| GET | `/api/profile` | Get current user profile | JWT |
| PUT | `/api/profile` | Update user profile | JWT |
| DELETE | `/api/profile` | Request account deletion (GDPR) | JWT |
| GET | `/api/profile/export` | Export all user data (GDPR) | JWT |
| POST | `/api/consent` | Log cookie/analytics consent | Optional |
| GET | `/health` | Health check | No |

---

## Compliance Summary (GDPR + CCPA)

### What We Collect
- Email address, name (account creation)
- Chat history (recipe queries + responses)
- Session metadata (IP address, user agent — in Better Auth session table)
- Consent preferences

### User Rights Implemented
| Right | Implementation |
|-------|---------------|
| Right to Know | Privacy Policy page + `/api/profile/export` |
| Right to Delete | `DELETE /api/profile` → queues deletion job |
| Right to Access | `GET /api/profile/export` → JSON dump |
| Right to Portability | Export includes all messages in JSON |
| Consent Management | Cookie banner + `consent_log` table |
| Data Minimisation | Only collect what's needed for core features |

### Technical Controls
- Cookie consent banner shown before any non-essential cookies
- No analytics fired before consent
- IP addresses stored hashed (SHA-256)
- Session data expires (Better Auth default: 7 days)
- Soft delete pattern for account deletion (30-day grace period)
- All data stored in Neon (EU region available for GDPR)

---

## Environment Variables Summary

### Frontend (.env.local)
```env
BETTER_AUTH_SECRET=<32+ char secret>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://...@ep-xxx.neon.tech/neondb
BETTER_AUTH_URL=http://localhost:3000
GEMINI_API_KEY=<your-gemini-key>
APIFY_API_TOKEN=<your-apify-token>
PEXELS_API_KEY=<your-pexels-key>
ALLOWED_ORIGINS=http://localhost:3000
```
