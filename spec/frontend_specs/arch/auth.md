# arch/auth.md — Auth Module (WARM)

```slc
@block ARCH auth_module
priority: critical
intent: "Better Auth server + client, JWT issuance/injection, route protection via proxy.ts"
scope: module
depends_on: none

content:
  decision_anchor:
    - "Better Auth SERVER is hosted IN this Next.js app (per MEMORY) — it owns the Neon user/session/account/jwks tables and serves JWKS that the FastAPI backend verifies against."
    - "Email + password ONLY. No OAuth, no email verification (requireEmailVerification: false), no password reset (CONTEXT non-goals + MEMORY)."

  server:
    file: "lib/auth.ts"
    config:
      - "betterAuth({ database: <Neon pooler>, emailAndPassword: { enabled: true, requireEmailVerification: false } })"
      - "plugins: [ jwt() ] — issues RS256 JWTs; exposes JWKS endpoint"
      - "JWT audience claim NOT set (backend uses verify_aud: False — MEMORY)"
    handler:
      file: "app/api/auth/[...all]/route.ts"
      exports: "GET, POST via toNextJsHandler(auth) — Better Auth Next.js adapter"

  client:
    file: "lib/auth-client.ts"
    config:
      - "createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL })"
      - "plugins: [ jwtClient() ] — exposes token retrieval"
    exports: "signIn, signUp, signOut, useSession, getToken/token helpers"

  jwt_injection:
    file: "lib/api.ts"
    rule: "Every call to the FastAPI backend attaches Authorization: Bearer <jwt> obtained from the Better Auth client. The JWT (not the session cookie) authenticates to FastAPI."
    flow: "client requests fresh JWT from Better Auth → set header → fetch NEXT_PUBLIC_API_URL/api/..."

  route_protection:
    file: "proxy.ts (project root — Next 16; replaces middleware.ts)"
    exported_fn: "proxy(request: NextRequest)"
    runtime: "nodejs (proxy does not support edge)"
    matcher: "['/chat/:path*', '/profile/:path*']"
    behavior: "If no valid Better Auth session → redirect to /sign-in. Optimistic check only — backend JWT verification is the real gate."

  pages:
    sign_in: "(auth)/sign-in/page.tsx — email+password form → authClient.signIn.email → router.push('/chat')"
    sign_up: "(auth)/sign-up/page.tsx — name+email+password → authClient.signUp.email → active immediately"

  errors_surface:
    - "401 from backend → token refresh attempt, else redirect to /sign-in"
    - "Invalid credentials → inline form error"

  boundaries:
    - "Frontend NEVER stores raw passwords; Better Auth handles hashing server-side"
    - "JWT obtained per-request from authClient; not hand-rolled"
@end
```
