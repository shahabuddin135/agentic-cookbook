"""SQLModel table models for the Agentic Cookbook backend.

Custom tables (managed by Alembic):
- Conversation
- Message
- ConsentLog
- DataDeletionRequest

Better Auth tables (managed by Next.js auth migration — READ ONLY from FastAPI):
- user, session, account, verification, jwks
"""

from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.compliance import ConsentLog, DataDeletionRequest  # noqa: F401
