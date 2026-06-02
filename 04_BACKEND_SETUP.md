# Backend Setup Guide — Agentic Cookbook

> FastAPI · Python 3.11+ · OpenAI Agents SDK · LiteLLM · Gemini 2.5 Flash
> Time: ~45 minutes

---

## Prerequisites

- Python 3.11 or higher
- Node.js 20+ (required for Apify MCP server which runs via npx)
- Neon PostgreSQL connection string
- API keys: Gemini, Apify, Pexels
- Frontend running on `http://localhost:3000` (for JWKS endpoint)

---

## Step 1: Create Project & Virtual Environment

```bash
mkdir agentic-cookbook-backend && cd agentic-cookbook-backend

# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh  # Linux/Mac
# Or on Windows: winget install astral-sh.uv

# Create project and virtual environment
uv init --no-workspace
uv venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows
```

---

## Step 2: Create Project Structure

```bash
mkdir -p app/{models,routers,agent,auth,middleware}
touch app/__init__.py \
      app/main.py \
      app/config.py \
      app/database.py \
      app/models/__init__.py \
      app/models/user.py \
      app/models/conversation.py \
      app/models/message.py \
      app/models/compliance.py \
      app/routers/__init__.py \
      app/routers/agent.py \
      app/routers/conversations.py \
      app/routers/profile.py \
      app/routers/consent.py \
      app/agent/__init__.py \
      app/agent/agent.py \
      app/agent/mcp_servers.py \
      app/auth/__init__.py \
      app/auth/jwt_verify.py
touch .env pyproject.toml
```

---

## Step 3: Install Python Dependencies

```bash
uv add \
  "fastapi>=0.115.0" \
  "uvicorn[standard]>=0.30.0" \
  "sqlmodel>=0.0.21" \
  "asyncpg>=0.29.0" \
  "pydantic-settings>=2.0.0" \
  "python-jose[cryptography]>=3.3.0" \
  "httpx>=0.27.0" \
  "openai-agents>=0.0.17" \
  "litellm>=1.50.0" \
  "alembic>=1.13.0" \
  "python-multipart>=0.0.9"

# Pexels MCP Server
uv add pexels-mcp-server

# uv.lock is generated automatically — commit it
```

> **Verify Node.js** is installed (needed for Apify MCP):
> ```bash
> node --version  # should be 20+
> npx --version
> ```

---

## Step 4: Environment Variables

Create `.env`:

```env
# Database (Neon PostgreSQL)
# Use the non-pooler URL for asyncpg (direct connection, port 5432)
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb

# Better Auth (your Next.js frontend URL — needed to fetch JWKS)
BETTER_AUTH_URL=http://localhost:3000

# AI — Gemini via LiteLLM
GEMINI_API_KEY=AIza...
LITELLM_MODEL=gemini/gemini-2.5-flash

# MCP Servers
APIFY_API_TOKEN=apify_api_...
PEXELS_API_KEY=...

# App
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=true
```

---

## Step 5: Configuration (`app/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Auth
    BETTER_AUTH_URL: str

    # AI
    GEMINI_API_KEY: str
    LITELLM_MODEL: str = "gemini/gemini-2.5-flash"

    # MCP
    APIFY_API_TOKEN: str
    PEXELS_API_KEY: str

    # App
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

---

## Step 6: Database Setup (`app/database.py`)

```python
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from typing import AsyncGenerator, Annotated
from fastapi import Depends

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Shorthand type annotation for routers
AsyncSessionDep = Annotated[AsyncSession, Depends(get_db)]
```

---

## Step 7: Database Models

### `app/models/conversation.py`
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    user_id: str = Field(index=True)      # FK to better-auth 'user' table
    title: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### `app/models/message.py`
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
import uuid

class Message(SQLModel, table=True):
    __tablename__ = "message"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    conversation_id: str = Field(index=True)
    role: str                               # "user" | "assistant"
    content: str
    image_url: Optional[str] = None
    metadata_: Optional[dict] = Field(
        default=None,
        sa_column=Column("metadata", JSONB)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### `app/models/compliance.py`
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class ConsentLog(SQLModel, table=True):
    __tablename__ = "consent_log"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: Optional[str] = None
    consent_type: str
    granted: bool
    ip_address_hash: Optional[str] = None
    user_agent: Optional[str] = None
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    revoked_at: Optional[datetime] = None

class DataDeletionRequest(SQLModel, table=True):
    __tablename__ = "data_deletion_request"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = Field(default="pending")  # pending | processing | completed | failed
```

---

## Step 8: JWT Verification (`app/auth/jwt_verify.py`)

```python
import httpx
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from datetime import datetime, timedelta

security = HTTPBearer()

_jwks_cache: dict | None = None
_jwks_fetched_at: datetime | None = None
JWKS_TTL = timedelta(hours=1)


async def get_jwks() -> dict:
    """Fetch and cache JWKS from Better Auth."""
    global _jwks_cache, _jwks_fetched_at
    now = datetime.utcnow()

    if _jwks_cache and _jwks_fetched_at and (now - _jwks_fetched_at) < JWKS_TTL:
        return _jwks_cache

    jwks_url = f"{settings.BETTER_AUTH_URL}/api/auth/jwks"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency: verify JWT and return user payload."""
    token = credentials.credentials

    try:
        jwks = await get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},  # No audience claim set in JWT plugin config
        )
        user_id: str | None = payload.get("sub") or payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")
        return {"user_id": user_id, "payload": payload}

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
```

---

## Step 9: MCP Servers (`app/agent/mcp_servers.py`)

```python
from contextlib import asynccontextmanager
from agents.mcp import MCPServerSse, MCPServerSseParams, MCPServerStdio, MCPServerStdioParams
from app.config import settings

_apify_server: MCPServerSse | None = None
_pexels_server: MCPServerStdio | None = None


async def get_mcp_servers() -> list:
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
    """Connect MCP servers on startup, cleanly disconnect on shutdown."""
    servers = await get_mcp_servers()
    connected = []
    try:
        for server in servers:
            await server.__aenter__()
            connected.append(server)
        app.state.mcp_servers = servers
        yield
    finally:
        for server in connected:
            try:
                await server.__aexit__(None, None, None)
            except Exception as e:
                print(f"Error closing MCP server: {e}")
```

---

## Step 10: AI Agent (`app/agent/agent.py`)

```python
import os
from agents import Agent
from agents.extensions.models.litellm_model import LitellmModel
from app.config import settings

os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

SYSTEM_PROMPT = """You are Cookbook, a friendly AI recipe assistant.

When a user asks for a recipe, you MUST:
1. Use the recipes_scraper tool (from apify_recipes MCP) to find a real, detailed recipe
2. Use the pexels image search tool (from pexels_images MCP) to find a beautiful photo of the finished dish

Your response MUST be valid JSON in this exact format:
{
  "message": "A friendly 1-2 sentence intro about the recipe",
  "recipe": {
    "title": "Recipe Name",
    "description": "Brief description",
    "prep_time": "15 minutes",
    "cook_time": "30 minutes",
    "servings": 4,
    "ingredients": ["1 cup ingredient", "..."],
    "instructions": ["Step 1: ...", "Step 2: ...", "..."],
    "tags": ["healthy", "quick", "..."],
    "source_url": "https://..."
  },
  "image": {
    "url": "https://images.pexels.com/...",
    "alt": "Description of the dish",
    "photographer": "Photographer Name",
    "photographer_url": "https://pexels.com/@photographer"
  }
}

Always credit the photographer. If no image is found, set image to null.
If no recipe is found, set recipe to null and explain in message.
"""


def create_recipe_agent(mcp_servers: list) -> Agent:
    return Agent(
        name="cookbook_agent",
        instructions=SYSTEM_PROMPT,
        model=LitellmModel(
            model=settings.LITELLM_MODEL,
            api_key=settings.GEMINI_API_KEY,
        ),
        mcp_servers=mcp_servers,
    )
```

---

## Step 11: Agent Chat Router (`app/routers/agent.py`)

```python
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner
from app.auth.jwt_verify import get_current_user
from app.agent.agent import create_recipe_agent
from app.database import AsyncSessionDep
from app.models.conversation import Conversation
from app.models.message import Message
import json, uuid
from datetime import datetime

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

    # Create new conversation if none provided
    conversation_id = body.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        conv = Conversation(
            id=conversation_id,
            user_id=user_id,
            title=body.message[:60],
        )
        db.add(conv)
        await db.commit()
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.commit()

    async def event_stream():
        try:
            result = await Runner.run(
                agent,
                input=body.message,
            )
            output = result.final_output

            # Parse the JSON response from the agent
            try:
                parsed = json.loads(output)
            except json.JSONDecodeError:
                parsed = {"message": output, "recipe": None, "image": None}

            # Save assistant message
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
        },
    )
```

---

## Step 12: Main App (`app/main.py`)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.agent.mcp_servers import lifespan_mcp
from app.routers import agent, conversations, profile, consent


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with lifespan_mcp(app):
        yield


app = FastAPI(
    title="Agentic Cookbook API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(agent.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(consent.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

---

## Step 13: Create Custom Tables (Alembic)

```bash
# Initialize Alembic (for custom tables — Better Auth manages its own tables)
alembic init alembic

# Edit alembic/env.py to import your models:
# from app.models.conversation import Conversation
# from app.models.message import Message
# from app.models.compliance import ConsentLog, DataDeletionRequest
# from app.database import engine
# target_metadata = SQLModel.metadata

# Generate migration
alembic revision --autogenerate -m "create custom tables"

# Run migration
alembic upgrade head
```

---

## Step 14: Run the Development Server

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 15: Verify MCP Connections

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test that MCP servers started (check uvicorn logs for):
# "Connected to MCP server: apify_recipes"
# "Connected to MCP server: pexels_images"
```

---

## Step 16: Test Auth Flow

```bash
# 1. Get a JWT from Better Auth (frontend must be running)
# Sign in via Next.js UI → get the JWT token

# 2. Test protected endpoint
curl -H "Authorization: Bearer <your_jwt>" \
     http://localhost:8000/api/conversations

# 3. Test JWKS endpoint is reachable from backend
curl http://localhost:3000/api/auth/jwks
# Should return { keys: [...] }
```

---

## Step 17: Test Agent Endpoint

```bash
curl -X POST http://localhost:8000/api/agent/chat \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "give me a simple pasta recipe"}'
```

Expected SSE events:
```
data: {"type": "recipe", "data": {...}, "conversation_id": "uuid", "message_id": "uuid"}
data: {"type": "done"}
```

---

## Verification Checklist

- [ ] `uvicorn` starts without errors
- [ ] MCP servers connect on startup (check logs)
- [ ] `GET /health` returns 200
- [ ] `GET /api/conversations` returns 401 without token
- [ ] `GET /api/conversations` returns 200 with valid JWT
- [ ] `GET http://localhost:3000/api/auth/jwks` returns JWKS keys
- [ ] `POST /api/agent/chat` streams a recipe response
- [ ] Message saved to `message` table after response
- [ ] Conversation saved to `conversation` table

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `JWTError: Signature verification failed` | Frontend not running or JWKS not available | Ensure Next.js runs on port 3000 and JWT plugin is configured |
| `Connection refused: asyncpg` | Wrong DATABASE_URL format | Must use `postgresql+asyncpg://` prefix |
| MCP server fails to start | Node.js not installed (for Apify) | `node --version` → install if missing |
| `ModuleNotFoundError: openai.agents` | Wrong SDK package | Install `openai-agents`, not `openai` |
| Pexels MCP not found | pip package name differs | Try `pip show pexels-mcp-server`, adjust command in `mcp_servers.py` |
| CORS error from browser | `ALLOWED_ORIGINS` mismatch | Add exact frontend URL to `ALLOWED_ORIGINS` |
