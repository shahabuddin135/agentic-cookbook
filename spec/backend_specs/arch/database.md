# arch/database.md — Database Module (WARM)

```slc
@block ARCH database_module
priority: critical
intent: "Async Neon PostgreSQL connection — engine, session factory, session dependency"
scope: module
depends_on: none

content:
  file: "backend/app/database.py"

  setup:
    engine: "create_async_engine(DATABASE_URL, echo=DEBUG, pool_size=5, max_overflow=10)"
    session_factory: "async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)"
    session_dep: "AsyncSessionDep = Annotated[AsyncSession, Depends(get_db)]"

  flow:
    get_db: >
      async generator — opens AsyncSession, yields it, commits on clean exit,
      rolls back on any exception, always closes in finally block.
      Used as: db: AsyncSessionDep in every router function signature.

    init_db: >
      async function called during app lifespan startup. Runs run_sync
      to call SQLModel.metadata.create_all(engine) to create custom tables.

  imports:
    - "from sqlmodel import SQLModel"
    - "from sqlmodel.ext.asyncio.session import AsyncSession"
    - "from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker"
    - "from typing import AsyncGenerator, Annotated"
    - "from fastapi import Depends"
    - "from app.config import settings"

  boundaries:
    - "DATABASE_URL must use postgresql+asyncpg:// prefix (not postgresql://)"
    - "SSL always required — sslmode=require in connection string"
    - "pool_size=5, max_overflow=10 — tuned for Neon serverless"
    - "All DB calls must be async — no sync SQLModel calls"
    - "Better Auth user table is READ-ONLY from FastAPI (except name via PUT /profile)"
    - "db: AsyncSessionDep has NO default — always injected by FastAPI DI"
@end
```
