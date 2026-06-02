# Frontend Requirements — Agentic Cookbook

> Next.js 15 (App Router) · Better Auth · shadcn/ui · Bun

---

## 1. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── sign-up/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── chat/
│   │   │   ├── page.tsx              ← new chat
│   │   │   └── [id]/
│   │   │       └── page.tsx          ← conversation view
│   │   └── profile/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          ← Better Auth handler
│   ├── privacy/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── layout.tsx                    ← root layout + providers
│   └── page.tsx                      ← redirect to /chat or /sign-in
├── components/
│   ├── auth/
│   │   ├── sign-in-form.tsx
│   │   └── sign-up-form.tsx
│   ├── chat/
│   │   ├── chat-window.tsx           ← conversation message list
│   │   ├── recipe-card.tsx           ← formatted recipe display
│   │   ├── recipe-skeleton.tsx       ← loading state
│   │   └── conversation-sidebar.tsx  ← history list
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── sidebar.tsx
│   ├── profile/
│   │   └── profile-form.tsx
│   ├── compliance/
│   │   └── cookie-banner.tsx         ← GDPR/CCPA consent
│   └── ui/                           ← shadcn/ui components
├── lib/
│   ├── auth.ts                       ← Better Auth server instance
│   ├── auth-client.ts                ← Better Auth client instance
│   ├── db.ts                         ← Neon/postgres connection
│   └── api.ts                        ← Axios/fetch wrapper for FastAPI
├── hooks/
│   ├── use-chat.ts                   ← chat state + SSE streaming
│   └── use-conversations.ts          ← React Query hooks
├── stores/
│   └── chat-store.ts                 ← Zustand: active conversation
├── types/
│   └── index.ts                      ← shared TypeScript types
└── middleware.ts                     ← route protection
```

---

## 2. Pages & Requirements

### 2.1 `/sign-in`
- Email + password fields (shadcn Input)
- "Sign in" button with loading state
- Link to `/sign-up`
- Error state: show server error message inline
- On success: redirect to `/chat`
- No redirect if already authenticated (middleware handles this)

### 2.2 `/sign-up`
- Name, Email, Password, Confirm Password fields
- Password validation: min 8 chars, must match
- "Create account" button with loading state
- Link to `/sign-in`
- On success: redirect to `/chat` immediately (no email verification required)
- GDPR: Must show "By signing up, you agree to our [Terms] and [Privacy Policy]" text

### 2.3 `/chat` (protected)
- Left sidebar: conversation history list (sorted by newest)
  - Each item shows title (first message, truncated) + relative time
  - "New Chat" button at top
  - Delete conversation icon per item
- Main area: message thread
  - User messages: aligned right, simple bubble
  - Assistant messages: RecipeCard component (see below)
  - Skeleton loader while streaming
- Bottom: `@kokonutui/ai-input-search` input component
  - On submit: POST to FastAPI, render streaming response
  - Disable input while waiting for response
- Empty state: centered welcome message + example prompts

### 2.4 `/chat/[id]` (protected)
- Same layout as `/chat`
- Loads existing conversation by ID
- All messages pre-rendered from API
- Continue adding messages to the conversation

### 2.5 `/profile` (protected)
- Display: name, email (read-only), account creation date
- Edit name (simple inline edit)
- Section: "Your Data" (GDPR/CCPA)
  - Button: "Export my data" → calls `GET /api/profile/export`
  - Button: "Delete my account" → shows confirmation modal → calls `DELETE /api/profile`
- Section: "Consent"
  - Toggle: Analytics cookies (persists to `consent_log`)
- Button: "Sign out"

### 2.6 `/privacy` and `/terms`
- Static pages
- Must clearly state: what data is collected, how it's used, retention periods
- Must include GDPR rights section
- Must include CCPA "Do Not Sell My Personal Information" declaration (we don't sell, state this)

---

## 3. RecipeCard Component

The core display component. Rendered for every AI assistant message.

```typescript
interface RecipeCardProps {
  image: {
    url: string;
    alt: string;
    photographer?: string;
    photographer_url?: string;
  };
  recipe: {
    title: string;
    description?: string;
    prep_time?: string;
    cook_time?: string;
    servings?: number;
    ingredients: string[];
    instructions: string[];
    tags?: string[];
    source_url?: string;
  };
  is_streaming?: boolean;
}
```

- Hero image with proper `alt` text and Pexels photo credit (required by Pexels API ToS)
- Title, description in editorial style
- Pill badges: prep time, cook time, servings
- Two-column layout: ingredients | instructions
- Skeleton version shown during streaming
- Graceful fallback if no image (placeholder illustration)

---

## 4. State Management

### Zustand Store (`chat-store.ts`)
```typescript
interface ChatStore {
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  setActiveConversation: (id: string | null) => void;
  setStreaming: (v: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  resetStream: () => void;
}
```

### TanStack Query Keys
```typescript
const queryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  profile: ['profile'] as const,
}
```

---

## 5. API Contract (Frontend → FastAPI)

All FastAPI calls include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Get JWT token via:
```typescript
import { jwtClient } from "better-auth/client/plugins"
const token = await authClient.jwt.token()  // from JWT plugin
```

### Chat
```typescript
// POST /api/agent/chat
// Request
{ message: string; conversation_id?: string }
// Response (SSE stream) — two events, in order:
// data: {"type": "recipe", "data": RecipeCardProps, "conversation_id": "uuid", "message_id": "uuid"}
// data: {"type": "done"}
// On error:
// data: {"type": "error", "message": "..."}

// GET /api/conversations
// Response
{ conversations: Conversation[] }

// GET /api/conversations/:id
// Response
{ conversation: Conversation; messages: Message[] }

// DELETE /api/conversations/:id
// Response: 204 No Content
```

### Profile
```typescript
// GET /api/profile
// Response
{ id: string; name: string; email: string; created_at: string }

// PUT /api/profile
// Request: { name: string }
// Response: updated user object

// DELETE /api/profile
// Response: { message: "Deletion scheduled. Account will be removed within 30 days." }

// GET /api/profile/export
// Response: Content-Disposition: attachment; filename="my-data.json"
```

---

## 6. Streaming (SSE)

The AI response arrives via a single SSE connection over a POST request.
`EventSource` is **not used** — it only supports GET. Use `fetch` + `ReadableStream`.

```typescript
// hooks/use-chat.ts
import { authClient } from "@/lib/auth-client"
import { useChatStore } from "@/stores/chat-store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL!

export function useChat() {
  const { setStreaming, clearStream, setActiveConversation } = useChatStore()

  const sendMessage = async (
    message: string,
    conversationId?: string
  ): Promise<{ conversationId: string; data: RecipeCardProps }> => {
    const token = await authClient.jwt.token()
    setStreaming(true)
    clearStream()

    const response = await fetch(`${API_BASE}/api/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()!   // keep last partial line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const payload = JSON.parse(line.slice(6))

        if (payload.type === "recipe") {
          setStreaming(false)
          setActiveConversation(payload.conversation_id)
          return { conversationId: payload.conversation_id, data: payload.data }
        }
        if (payload.type === "error") {
          setStreaming(false)
          throw new Error(payload.message)
        }
        // type === "done": stream finished cleanly
      }
    }

    setStreaming(false)
    throw new Error("Stream ended without a recipe event")
  }

  return { sendMessage }
}
```

---

## 7. Authentication (Better Auth Client)

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [jwtClient()]
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
```

### Route Protection (middleware.ts)
```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const session = getSessionCookie(request)

  const isProtected = ['/chat', '/profile'].some(p =>
    request.nextUrl.pathname.startsWith(p)
  )
  const isAuthPage = ['/sign-in', '/sign-up'].some(p =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*', '/profile/:path*', '/sign-in', '/sign-up']
}
```

---

## 8. GDPR / CCPA Frontend Requirements

### Cookie Consent Banner
- Shown on first visit before any non-essential code runs
- Options: "Accept Essential Only" | "Accept All"
- Preference stored in a first-party cookie (`consent_pref`) + POST to `/api/consent`
- Essential cookies (no consent needed): Better Auth session cookie
- Non-essential: analytics, performance monitoring

### Implementation
```typescript
// lib/consent.ts
type ConsentPref = { essential: true; analytics: boolean }

export function getConsent(): ConsentPref | null {
  const raw = document.cookie.match(/consent_pref=([^;]+)/)
  return raw ? JSON.parse(decodeURIComponent(raw[1])) : null
}

export function setConsent(pref: ConsentPref) {
  const value = encodeURIComponent(JSON.stringify(pref))
  document.cookie = `consent_pref=${value}; max-age=${365*24*3600}; SameSite=Lax; Secure`
}
```

### Required Links (visible everywhere)
- Footer: "Privacy Policy" | "Terms of Service" | "Cookie Preferences"
- Profile: "Export My Data" | "Delete My Account"

---

## 9. TypeScript Types

```typescript
// types/index.ts
export interface User {
  id: string
  name: string
  email: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  userId: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  metadata?: RecipeMetadata
  createdAt: string
}

export interface RecipeMetadata {
  title: string
  description?: string
  prep_time?: string
  cook_time?: string
  servings?: number
  ingredients: string[]
  instructions: string[]
  tags?: string[]
  source_url?: string
  image?: {
    url: string
    alt: string
    photographer?: string
    photographer_url?: string
  }
}
```

---

## 10. Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "latest",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "pg": "^8.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/pg": "^8.0.0"
  }
}
```

### shadcn/ui Components Needed
```
button, input, card, label, skeleton, separator, avatar,
dialog, alert, badge, scroll-area, dropdown-menu, toast
```

---

## 11. Environment Variables

```env
# .env.local (frontend)
BETTER_AUTH_SECRET=<minimum 32 char secret — use openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 12. Deployment Notes (Vercel)

- `DATABASE_URL` must use pooler URL from Neon (port 5432) for serverless
- `BETTER_AUTH_URL` must be the production URL in prod
- `NEXT_PUBLIC_API_URL` must point to deployed FastAPI service
- Set `ALLOWED_ORIGINS` on FastAPI to match Vercel deployment URL
