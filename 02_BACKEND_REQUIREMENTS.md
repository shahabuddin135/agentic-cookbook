# Backend Requirements — Agentic Cookbook

> FastAPI · Python 3.11+ · OpenAI Agents SDK · LiteLLM · Gemini 2.5 Flash · Neon PostgreSQL

---

## 1. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    ← FastAPI app, CORS, lifespan
│   ├── config.py                  ← Settings via pydantic-settings
│   ├── database.py                ← Async Neon connection (asyncpg)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                ← SQLModel: User (mirrors Better Auth)
│   │   ├── conversation.py        ← SQLModel: Conversation
│   │   └── message.py             ← SQLModel: Message
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── agent.py               ← POST /api/agent/chat (SSE stream)
│   │   ├── conversations.py       ← CRUD for conversations/messages
│   │   ├── profile.py             ← Profile, export, deletion
│   │   └── consent.py             ← GDPR consent logging
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent.py               ← OpenAI Agents SDK setup
│   │   ├── tools.py               ← Tool definitions (if not via MCP)
│   │   └── mcp_servers.py         ← MCP server connection management
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt_verify.py          ← JWKS fetch + JWT verification
│   └── middleware/
│       ├── __init__.py
│       └── rate_limit.py          ← Simple per-user rate limiting
├── alembic/                       ← DB migrations (for custom tables only)
│   ├── env.py
│   └── versions/
├── tests/
│   ├── test_agent.py
│   └── test_auth.py
├── .env
├── alembic.ini
├── pyproject.toml
└── uv.lock
```

---

## 2. FastAPI App Setup (`main.py`)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.agent.mcp_servers import lifespan_mcp
from app.routers import agent, conversations, profile, consent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start MCP servers
    async with lifespan_mcp(app):
        yield

app = FastAPI(
    title="Agentic Cookbook API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,  # hide in prod
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(agent.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(consent.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## 3. Configuration (`config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str  # postgresql+asyncpg://...

    # Auth
    BETTER_AUTH_URL: str  # http://localhost:3000 (Next.js URL)

    # AI
    GEMINI_API_KEY: str
    LITELLM_MODEL: str = "gemini/gemini-2.5-flash"

    # MCP
    APIFY_API_TOKEN: str
    PEXELS_API_KEY: str

    # App
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 4. JWT Verification (`auth/jwt_verify.py`)

Better Auth (with JWT plugin) exposes a JWKS endpoint at:
`{BETTER_AUTH_URL}/api/auth/jwks`

FastAPI fetches and caches this to verify incoming JWTs.

```python
import httpx
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from datetime import datetime, timedelta
import asyncio

security = HTTPBearer()

# In-memory JWKS cache (refresh every 1 hour)
_jwks_cache: dict | None = None
_jwks_fetched_at: datetime | None = None
JWKS_TTL = timedelta(hours=1)

async def get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = datetime.utcnow()
    if _jwks_cache and _jwks_fetched_at and (now - _jwks_fetched_at) < JWKS_TTL:
        return _jwks_cache
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.BETTER_AUTH_URL}/api/auth/jwks")
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    try:
        jwks = await get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Better Auth doesn't set aud by default
        )
        user_id = payload.get("sub") or payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"user_id": user_id, "payload": payload}
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

---

## 5. AI Agent (`agent/agent.py`)

```python
from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel
from app.config import settings
from app.agent.mcp_servers import get_mcp_servers
import os

os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

SYSTEM_PROMPT = """
You are a helpful recipe assistant called Cookbook. 
When a user asks for a recipe:
1. Use the recipes_scraper tool to find a real, detailed recipe
2. Use the pexels_image_search tool to find a beautiful photo of the dish
3. Return a structured response with both the recipe details and the image

Always include:
- Full ingredient list with measurements
- Step-by-step instructions
- Prep and cook times
- Number of servings
- Image with photographer credit (required)

If you cannot find a recipe, suggest alternatives.
Be conversational and encouraging.
"""

def create_recipe_agent(mcp_servers):
    return Agent(
        name="recipe_agent",
        instructions=SYSTEM_PROMPT,
        model=LitellmModel(
            model=settings.LITELLM_MODEL,
            api_key=settings.GEMINI_API_KEY,
        ),
        mcp_servers=mcp_servers,
        output_type=None,  # Free-form text + tool calls
    )
```

---

## 6. MCP Servers (`agent/mcp_servers.py`)

```python
from contextlib import asynccontextmanager
from agents.mcp import MCPServerSse, MCPServerSseParams, MCPServerStdio, MCPServerStdioParams
from app.config import settings

# Global MCP server instances (managed per request or as singletons)
_apify_server: MCPServerSse | None = None
_pexels_server: MCPServerStdio | None = None


async def get_mcp_servers():
    """Get or create MCP server connections."""
    global _apify_server, _pexels_server

    if _apify_server is None:
        _apify_server = MCPServerSse(
            params=MCPServerSseParams(
                url="https://mcp.apify.com/?tools=web.harvester/recipes-scraper",
                headers={"Authorization": f"Bearer {settings.APIFY_API_TOKEN}"},
            ),
            cache_tools_list=True,
            name="apify_recipes",
        )

    if _pexels_server is None:
        _pexels_server = MCPServerStdio(
            params=MCPServerStdioParams(
                command="pexels-mcp-server",
                args=[],
                env={"PEXELS_API_KEY": settings.PEXELS_API_KEY},
            ),
            cache_tools_list=True,
            name="pexels_images",
        )

    return [_apify_server, _pexels_server]


@asynccontextmanager
async def lifespan_mcp(app):
    """Start and cleanly stop MCP servers with app lifecycle."""
    servers = await get_mcp_servers()
    try:
        for server in servers:
            await server.__aenter__()
        app.state.mcp_servers = servers
        yield
    finally:
        for server in servers:
            await server.__aexit__(None, None, None)
```

---

## 7. Agent Chat Endpoint (`routers/agent.py`)

```python
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner
from app.auth.jwt_verify import get_current_user
from app.agent.agent import create_recipe_agent
from app.database import AsyncSessionDep
from app.models.conversation import Conversation
from app.models.message import Message
import json, uuid

router = APIRouter(tags=["agent"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


@router.post("/agent/chat")
async def chat(
    body: ChatRequest,
    request: Request,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    mcp_servers = request.app.state.mcp_servers
    agent = create_recipe_agent(mcp_servers)

    # Create or retrieve conversation
    conversation_id = body.conversation_id or str(uuid.uuid4())
    # (save conversation to DB if new)

    async def event_stream():
        try:
            result = await Runner.run(
                agent,
                input=body.message,
            )
            output = result.final_output

            # Parse the structured JSON response from the agent
            try:
                parsed = json.loads(output)
            except json.JSONDecodeError:
                parsed = {"message": output, "recipe": None, "image": None}

            # Save assistant message to DB
            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=parsed.get("message", ""),
                image_url=parsed.get("image", {}).get("url") if parsed.get("image") else None,
                metadata_=parsed,
            )
            db.add(assistant_msg)
            await db.commit()

            yield f"data: {json.dumps({'type': 'recipe', 'data': parsed, 'conversation_id': conversation_id, 'message_id': assistant_msg.id})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
```

---

## 8. Database Models (SQLModel)

```python
# models/conversation.py
from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    title: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# models/message.py
from sqlmodel import SQLModel, Field
from typing import Any
import uuid
from datetime import datetime

class Message(SQLModel, table=True):
    __tablename__ = "message"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    conversation_id: str = Field(foreign_key="conversation.id", index=True)
    role: str  # "user" | "assistant"
    content: str
    image_url: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, sa_column_kwargs={"type_": "JSONB"})
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Note: The 'user' table is owned by Better Auth.
# FastAPI reads from it but does NOT write to it (except via profile update).
# user.py only defines a read-only model matching Better Auth's schema.
```

---

## 9. Conversations Router

```python
# routers/conversations.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth.jwt_verify import get_current_user
from app.database import AsyncSessionDep
from app.models.conversation import Conversation
from app.models.message import Message
from sqlmodel import select

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    result = await db.exec(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return {"conversations": result.all()}


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user)
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404)
    
    messages = await db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return {"conversation": conv, "messages": messages.all()}


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user)
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404)
    await db.delete(conv)
    await db.commit()
```

---

## 10. Profile + GDPR Endpoints

```python
# routers/profile.py
@router.get("/profile")
async def get_profile(db: AsyncSessionDep, current_user: dict = Depends(get_current_user)):
    # Select from better-auth "user" table
    ...

@router.delete("/profile")
async def delete_account(db: AsyncSessionDep, current_user: dict = Depends(get_current_user)):
    """GDPR Right to Erasure — schedules deletion within 30 days."""
    # Insert into data_deletion_request table
    # Return 202 Accepted with message
    ...

@router.get("/profile/export")
async def export_data(db: AsyncSessionDep, current_user: dict = Depends(get_current_user)):
    """GDPR Right to Access + Data Portability — returns JSON file."""
    # Collect: user row, all conversations, all messages
    # Return as StreamingResponse with Content-Disposition: attachment
    ...
```

---

## 11. GDPR / CCPA Backend Requirements

### Consent Logging
```python
# models/consent.py
class ConsentLog(SQLModel, table=True):
    __tablename__ = "consent_log"
    id: str = Field(default_factory=..., primary_key=True)
    user_id: str | None = None           # null if pre-auth
    consent_type: str                    # "essential" | "analytics"
    granted: bool
    ip_address_hash: str | None = None   # SHA-256 of IP
    user_agent: str | None = None
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    revoked_at: datetime | None = None
```

### Data Retention Policy
- Chat messages: retained while account is active
- Session data: 7 days (Better Auth default)
- Deletion requests: processed within 30 days
- Consent logs: retained for 3 years (legal compliance)
- Deleted account: all PII anonymised; conversation rows deleted

### IP Handling
```python
import hashlib

def anonymize_ip(ip: str) -> str:
    # Hash the IP so we can't identify the person but can detect abuse patterns
    return hashlib.sha256(ip.encode()).hexdigest()
```

---

## 12. Backend Dependencies

```toml
# pyproject.toml
[project]
name = "agentic-cookbook-api"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlmodel>=0.0.21",
    "asyncpg>=0.29.0",
    "pydantic-settings>=2.0.0",
    "python-jose[cryptography]>=3.3.0",  # JWT verification
    "httpx>=0.27.0",                     # JWKS fetching
    "openai-agents>=0.0.17",             # OpenAI Agents SDK
    "litellm>=1.50.0",                   # LLM proxy
    "pexels-mcp-server",                 # Pexels MCP (verify exact pip name)
    "alembic>=1.13.0",                   # DB migrations (custom tables)
    "python-multipart>=0.0.9",
]
```

---

## 13. Environment Variables

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb
BETTER_AUTH_URL=http://localhost:3000
GEMINI_API_KEY=AIza...
LITELLM_MODEL=gemini/gemini-2.5-flash
APIFY_API_TOKEN=apify_api_...
PEXELS_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=true
```

---

## 14. Rate Limiting (Per User)

Simple in-memory rate limiting for the agent endpoint:
- Max 10 requests per user per minute
- Return HTTP 429 with `Retry-After` header

In production: use Redis or a service like Upstash for distributed rate limiting.
