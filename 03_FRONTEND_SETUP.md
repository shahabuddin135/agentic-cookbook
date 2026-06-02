# Frontend Setup Guide — Agentic Cookbook

> Next.js 15 · Better Auth · shadcn/ui · Bun
> Time: ~30 minutes

---

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 20+ (Bun uses Node for some tools)
- Neon PostgreSQL account + connection string
- Backend running (for auth + API calls)

---

## Step 1: Create Next.js Project

```bash
bun create next-app@latest agentic-cookbook-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd agentic-cookbook-frontend
```

---

## Step 2: Install Dependencies

```bash
# Core dependencies
bun add better-auth \
  @tanstack/react-query \
  zustand \
  zod \
  pg

# Types
bun add -d @types/pg

# For Neon connection in Next.js
bun add @neondatabase/serverless
```

---

## Step 3: Install shadcn/ui

```bash
# Initialize shadcn
bunx --bun shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Zinc (or your preference)
- CSS variables: Yes

```bash
# Install required components
bunx --bun shadcn@latest add \
  button input card label skeleton separator \
  avatar dialog alert badge scroll-area \
  dropdown-menu sheet
```

---

## Step 4: Install KokonutUI AI Input Component

```bash
bunx --bun shadcn@latest add @kokonutui/ai-input-search
```

> **Note:** If this command fails (the component may need to be manually installed),
> try: `bun add @kokonutui/ui` and import `AiInputSearch` from `@kokonutui/ui`
> OR visit https://kokonutui.com and copy the component manually into `src/components/ui/ai-input-search.tsx`

---

## Step 5: Set Up Environment Variables

Create `src/.env.local`:

```env
# Better Auth
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Neon Database (for Better Auth tables)
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# FastAPI Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 6: Configure Better Auth Server

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,       // 7 days
    updateAge: 60 * 60 * 24,            // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                   // 5 minute client cache
    },
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL!,
        expiresIn: "1h",               // JWT for FastAPI — short-lived
      },
    }),
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
    process.env.NEXT_PUBLIC_API_URL!,
  ],
})
```

---

## Step 7: Mount Better Auth Handler

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { POST, GET } = toNextJsHandler(auth)
```

---

## Step 8: Configure Better Auth Client

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [jwtClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
```

---

## Step 9: Generate Better Auth Database Tables

```bash
# Generate and run migrations for Better Auth tables in Neon
bunx auth@latest generate

# OR to migrate directly (uses built-in Kysely adapter)
bunx auth@latest migrate
```

This creates: `user`, `session`, `account`, `verification`, `jwks` tables in your Neon database.

> **Note:** The `jwks` table is created by the JWT plugin. Without it, FastAPI cannot verify tokens.
> The `verification` table is also created by Better Auth but is **not actively used** — email verification is disabled in this app (`requireEmailVerification: false`).

---

## Step 10: Set Up Route Protection Middleware

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PROTECTED_PATHS = ["/chat", "/profile"]
const AUTH_PATHS = ["/sign-in", "/sign-up"]

export async function middleware(request: NextRequest) {
  const session = getSessionCookie(request)
  const path = request.nextUrl.pathname

  const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p))
  const isAuthPage = AUTH_PATHS.some(p => path.startsWith(p))

  if (isProtected && !session) {
    const url = new URL("/sign-in", request.url)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/profile/:path*",
    "/sign-in",
    "/sign-up",
  ],
}
```

---

## Step 11: Root Layout with Providers

Create `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/providers/query-provider"
import { CookieBanner } from "@/components/compliance/cookie-banner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Agentic Cookbook",
  description: "AI-powered recipe discovery",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <CookieBanner />
      </body>
    </html>
  )
}
```

Create `src/components/providers/query-provider.tsx`:

```typescript
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

---

## Step 12: Sign In Page

Create `src/app/(auth)/sign-in/page.tsx`:

```typescript
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await signIn.email({
      email,
      password,
      callbackURL: "/chat",
    })

    if (error) {
      setError(error.message || "Sign in failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground">
          No account?{" "}
          <a href="/sign-up" className="underline">Create one</a>
        </p>
      </div>
    </div>
  )
}
```

---

## Step 13: Sign Up Page

Create `src/app/(auth)/sign-up/page.tsx`:

```typescript
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    setError("")

    const { data, error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/chat",
    })

    if (error) {
      setError(error.message || "Sign up failed")
      setLoading(false)
    }
    // On success Better Auth sets the session cookie and redirects via callbackURL
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start discovering recipes</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <a href="/sign-in" className="underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
```

> **No email verification step** — after `signUp.email()` succeeds, Better Auth creates the session immediately and the user is redirected to `/chat`. No confirmation email is sent (`requireEmailVerification: false`).

---

## Step 14: API Utility (calls FastAPI)

Create `src/lib/api.ts`:

```typescript
import { authClient } from "@/lib/auth-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL!

async function getAuthHeaders() {
  const token = await authClient.jwt.token()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}${path}`, { headers })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async streamPost(path: string, body: unknown): Promise<ReadableStream<Uint8Array>> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { ...headers, Accept: "text/event-stream" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.body!
  },

  async delete(path: string): Promise<void> {
    const headers = await getAuthHeaders()
    await fetch(`${API_BASE}${path}`, { method: "DELETE", headers })
  },
}
```

---

## Step 15: Zustand Chat Store

Create `src/stores/chat-store.ts`:

```typescript
import { create } from "zustand"

interface ChatStore {
  activeConversationId: string | null
  isStreaming: boolean
  streamChunks: string[]
  setActiveConversation: (id: string | null) => void
  setStreaming: (v: boolean) => void
  appendChunk: (chunk: string) => void
  clearStream: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  streamChunks: [],
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setStreaming: (v) => set({ isStreaming: v }),
  appendChunk: (chunk) => set((s) => ({ streamChunks: [...s.streamChunks, chunk] })),
  clearStream: () => set({ streamChunks: [], isStreaming: false }),
}))
```

---

## Step 16: Cookie Consent Banner (GDPR/CCPA)

Create `src/components/compliance/cookie-banner.tsx`:

```typescript
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const pref = document.cookie.match(/consent_pref=([^;]+)/)
    if (!pref) setVisible(true)
  }, [])

  const accept = (analytics: boolean) => {
    const pref = encodeURIComponent(JSON.stringify({ essential: true, analytics }))
    document.cookie = `consent_pref=${pref}; max-age=${365 * 24 * 3600}; SameSite=Lax; Secure`
    // Also POST to /api/consent
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essential: true, analytics }),
    })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use essential cookies to keep you signed in. With your consent, we also use
          analytics cookies to improve the app.{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => accept(false)}>
            Essential only
          </Button>
          <Button size="sm" onClick={() => accept(true)}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 17: Run the Development Server

```bash
bun run dev
```

Visit `http://localhost:3000` — you should see the sign-in redirect.

---

## Verification Checklist

- [ ] `/sign-in` and `/sign-up` pages render
- [ ] Can create an account and sign in
- [ ] `/chat` redirects to sign-in when not authenticated
- [ ] After sign in, redirects to `/chat`
- [ ] Session cookie is set (`better-auth.session_token`)
- [ ] `GET http://localhost:3000/api/auth/jwks` returns keys (JWT plugin working)
- [ ] Cookie banner appears on first visit
- [ ] `GET http://localhost:3000/api/auth/session` returns user object after sign in
