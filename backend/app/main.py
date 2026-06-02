from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.compliance import ConsentLog, DataDeletionRequest  # noqa: F401
from app.models.user import User  # noqa: F401
from app.auth.jwt_verify import get_current_user
from app.agent.mcp_servers import lifespan_mcp
from app.routers.agent import router as agent_router
from app.routers.conversations import router as conversations_router
from app.routers.profile import router as profile_router
from app.routers.consent import router as consent_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    # Connect MCP servers
    async with lifespan_mcp(app):
        yield

app = FastAPI(
    title="Agentic Cookbook API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(agent_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(consent_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
