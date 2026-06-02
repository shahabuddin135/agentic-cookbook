# contract/profile_api.md — Profile API (Frontend, DERIVED)

> Mirrors `backend_specs/contract/profile_api.profile_api`. Backend is authoritative.

```slc
@block CONTRACT frontend_profile_api
priority: high
intent: "Client view of profile + GDPR endpoints + TS types"
scope: module
depends_on: [backend_specs/contract/profile_api, arch/profile.profile_module]

content:
  base: "${NEXT_PUBLIC_API_URL}/api/profile"
  auth: "Bearer JWT (all)"

  endpoints:
    get:
      call: "GET /api/profile"
      response: "Profile"
      hook: "useProfile() → ['profile']"
    update:
      call: "PUT /api/profile { name }"
      response: "Profile (email immutable)"
      hook: "useUpdateProfile() → invalidate ['profile']"
      errors: { 422: "empty/missing name" }
    export:
      call: "GET /api/profile/export"
      response: "application/json file; Content-Disposition: attachment; filename=my-data.json"
      handling: "raw fetch → response.blob() → download (NOT a Query hook)"
      body_shape: "{ exported_at, user: Profile, conversations: (Conversation & { messages: Message[] })[] }"
    delete:
      call: "DELETE /api/profile"
      response: "202 { message: 'Deletion scheduled. Account will be removed within 30 days.' }"
      handling: "soft delete — on 202: signOut + confirmation screen"

  ts_types:
    Profile: "{ id: string; name: string; email: string; created_at: string }"

  ui_invariants:
    - "Email read-only; PUT sends only name"
    - "Deletion copy must state 30-day grace, never instant erasure"
@end
```
