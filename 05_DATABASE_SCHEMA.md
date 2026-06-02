# Database Schema — Agentic Cookbook
# Neon PostgreSQL

> Run this AFTER Better Auth generates its own tables via `npx auth@latest migrate`
> Better Auth tables: user, session, account, verification, jwks
> This file: custom app tables only (conversation, message, compliance)

---

## Full SQL Schema

```sql
-- ============================================================
-- NOTE: Tables below are managed by Better Auth.
-- They are shown here for documentation only.
-- DO NOT create these manually — run: npx auth@latest migrate
-- ============================================================
--
-- "user" (Better Auth)
--   id TEXT PRIMARY KEY
--   name TEXT NOT NULL
--   email TEXT UNIQUE NOT NULL
--   email_verified BOOLEAN DEFAULT FALSE
--   image TEXT
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--
-- "session" (Better Auth)
--   id TEXT PRIMARY KEY
--   expires_at TIMESTAMPTZ NOT NULL
--   token TEXT UNIQUE NOT NULL
--   created_at TIMESTAMPTZ NOT NULL
--   updated_at TIMESTAMPTZ NOT NULL
--   ip_address TEXT
--   user_agent TEXT
--   user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
--
-- "account" (Better Auth)
--   id TEXT PRIMARY KEY, account_id TEXT, provider_id TEXT,
--   user_id TEXT REFERENCES "user"(id), access_token TEXT,
--   refresh_token TEXT, id_token TEXT, ...
--
-- "verification" (Better Auth)
--   id TEXT PRIMARY KEY, identifier TEXT, value TEXT,
--   expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
--   NOTE: Email verification is DISABLED (requireEmailVerification: false).
--         Table is created by Better Auth but not actively used in this app.
--
-- "jwks" (Better Auth — created by JWT plugin)
--   id TEXT PRIMARY KEY, public_key TEXT, private_key TEXT, created_at TIMESTAMPTZ
-- ============================================================


-- ============================================================
-- CUSTOM TABLES (create these via Alembic or run manually)
-- ============================================================

-- Conversation: a chat session
CREATE TABLE IF NOT EXISTS conversation (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,                        -- references better-auth "user"(id)
    title       TEXT,                                  -- first message, truncated
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_user_id ON conversation(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_updated_at ON conversation(updated_at DESC);


-- Message: individual messages within a conversation
CREATE TABLE IF NOT EXISTS message (
    id                TEXT PRIMARY KEY,
    conversation_id   TEXT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content           TEXT NOT NULL,                    -- text content / assistant intro
    image_url         TEXT,                             -- Pexels image URL (assistant only)
    metadata          JSONB,                            -- full recipe JSON (assistant only)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_conversation_id ON message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON message(created_at ASC);


-- ConsentLog: GDPR/CCPA consent tracking
CREATE TABLE IF NOT EXISTS consent_log (
    id               TEXT PRIMARY KEY,
    user_id          TEXT,                              -- NULL if logged before auth
    consent_type     TEXT NOT NULL,                    -- 'essential' | 'analytics'
    granted          BOOLEAN NOT NULL,
    ip_address_hash  TEXT,                             -- SHA-256 hash (not raw IP)
    user_agent       TEXT,
    granted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);


-- DataDeletionRequest: GDPR right to erasure queue
CREATE TABLE IF NOT EXISTS data_deletion_request (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_deletion_status ON data_deletion_request(status);
```

---

## Metadata JSONB Shape

The `message.metadata` column stores the full parsed agent response:

```json
{
  "message": "Here's a beautiful Thai Green Curry for you!",
  "recipe": {
    "title": "Authentic Thai Green Curry",
    "description": "A fragrant, creamy curry...",
    "prep_time": "15 minutes",
    "cook_time": "25 minutes",
    "servings": 4,
    "ingredients": [
      "400ml coconut milk",
      "2 tbsp green curry paste",
      "500g chicken breast, sliced"
    ],
    "instructions": [
      "Heat a wok over medium-high heat...",
      "Add green curry paste and fry..."
    ],
    "tags": ["thai", "curry", "healthy", "gluten-free"],
    "source_url": "https://..."
  },
  "image": {
    "url": "https://images.pexels.com/photos/xxx/...",
    "alt": "Bowl of Thai green curry with jasmine rice",
    "photographer": "Jane Doe",
    "photographer_url": "https://www.pexels.com/@janedoe"
  }
}
```

---

## Neon Configuration Notes

### Connection Strings
```
# For Next.js (Better Auth) — pooler connection, supports serverless
BETTER_AUTH_DATABASE_URL=
  postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# For FastAPI (asyncpg) — direct connection, NOT pooler
FASTAPI_DATABASE_URL=
  postgresql+asyncpg://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb

# Note: Neon provides two hostnames:
# Pooler (port 5432):  ep-xxx-pooler.eu-central-1.aws.neon.tech  ← use for Next.js/serverless
# Direct (port 5432):  ep-xxx.eu-central-1.aws.neon.tech          ← use for FastAPI/long-lived
```

### Region Choice (GDPR)
- For GDPR compliance: choose `eu-central-1` (Frankfurt) or another EU region
- For CCPA: any US region is fine (California data laws apply to the company, not location of DB)

### SSL
- Always include `sslmode=require` in connection strings to Neon
- asyncpg: use `ssl=True` in engine creation

---

## Alembic Setup (Custom Tables Only)

```bash
# 1. Initialize Alembic
alembic init alembic

# 2. Edit alembic/env.py — add this:
from sqlmodel import SQLModel
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.compliance import ConsentLog, DataDeletionRequest
from app.config import settings

# Replace the target_metadata line with:
target_metadata = SQLModel.metadata

# Replace sqlalchemy.url with:
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("+asyncpg", ""))

# 3. Generate initial migration
alembic revision --autogenerate -m "create app tables"

# 4. Apply
alembic upgrade head

# 5. Future migrations:
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

---

## Entity Relationship Diagram

```
better-auth "user" (1) ──────< conversation (N)
                                     │
                                     └──────< message (N)

better-auth "user" (1) ──────< consent_log (N)

better-auth "user" (1) ──────< data_deletion_request (N)

better-auth "user" (1) ──────< session (N)    [managed by better-auth]
better-auth "user" (1) ──────< account (N)    [managed by better-auth]
```

---

## Data Retention Policy

| Table | Retention | Action |
|-------|-----------|--------|
| `user` | Until deletion request processed (30 days) | Anonymize: name → "Deleted User", email → null |
| `session` | 7 days (auto-expire via Better Auth) | Auto |
| `conversation` | Until user deletes or account deleted | Hard delete on account deletion |
| `message` | Same as conversation | Hard delete on account deletion |
| `consent_log` | 3 years (legal compliance) | Anonymize user_id on account deletion |
| `data_deletion_request` | 3 years | Keep for audit |
| `jwks` | Rotated by Better Auth | Auto |
