# contract/profile_api.md — Profile API Contract (WARM)

```slc
@block CONTRACT profile_api
priority: high
intent: "User profile read/update and GDPR data rights endpoints"
scope: module
depends_on: [arch/profile.profile_module]

content:
  router_prefix: "/api/profile"
  auth: required (all endpoints)

  GET /:
    description: "Get current user's profile"
    response:
      status: 200
      body:
        id: "string"
        name: "string"
        email: "string"
        created_at: "string (ISO 8601)"

  PUT /:
    description: "Update current user's name (email is immutable)"
    request:
      body:
        name: "string — required"
    response:
      status: 200
      body: "updated profile object (same shape as GET /)"
    errors:
      422: "Missing or empty name field"

  GET /export:
    description: "GDPR Art. 20 data portability — full JSON export"
    response:
      status: 200
      headers:
        Content-Type: "application/json"
        Content-Disposition: "attachment; filename=my-data.json"
      body:
        exported_at: "string (ISO 8601)"
        user: "profile object"
        conversations: "Conversation[] with messages nested"

  DELETE /:
    description: "GDPR Art. 17 erasure request — queues for 30-day deletion"
    response:
      status: 202
      body:
        message: "Deletion scheduled. Account will be removed within 30 days."
    note: "Does NOT delete immediately — creates a DataDeletionRequest row"
@end
```
