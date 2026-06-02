# arch/profile.md — Profile & GDPR Rights Module (WARM)

```slc
@block ARCH profile_module
priority: high
intent: "Profile view/update + GDPR data export and erasure request UI"
scope: module
depends_on: [backend_specs/contract/profile_api]

content:
  contract_anchor:
    - "GET /api/profile → { id, name, email, created_at }"
    - "PUT /api/profile { name } → updated profile (email immutable; 422 if name empty)"
    - "GET /api/profile/export → JSON file (Content-Disposition: attachment; filename=my-data.json)"
    - "DELETE /api/profile → 202 'Deletion scheduled... within 30 days' (soft delete, NOT immediate)"

  hooks:
    file: "hooks/use-profile.ts ('use client')"
    hooks:
      - "useProfile() → useQuery(['profile'])"
      - "useUpdateProfile() → useMutation(PUT) → invalidate ['profile']"
      - "useDeleteAccount() → useMutation(DELETE) → on 202 sign out + confirmation screen"

  page:
    file: "(app)/profile/page.tsx"
    sections:
      account: "show email (read-only) + created_at; editable name field with Save"
      data_rights: "GDPR controls block"

  data_export:
    component: "Export-my-data button"
    impl: "fetch GET /api/profile/export with Bearer JWT → response.blob() → trigger browser download as my-data.json"
    note: "Read the Content-Disposition filename; fall back to my-data.json"

  account_deletion:
    component: "Delete-my-account button"
    impl: "confirm dialog (shadcn AlertDialog) → DELETE /api/profile → expect 202 → show '30-day grace' message → signOut → redirect /sign-in"
    copy: "Must clearly state deletion is scheduled within 30 days, not instant (matches backend soft-delete + MEMORY)"

  boundaries:
    - "Email is immutable in the UI (PUT only sends name)"
    - "Deletion UI must reflect 202/soft-delete semantics — never imply instant erasure"
@end
```
