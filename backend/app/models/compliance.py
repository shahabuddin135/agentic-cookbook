from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import SQLModel, Field


class ConsentLog(SQLModel, table=True):
    __tablename__ = "consent_log"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: Optional[str] = None  # null for pre-auth consent
    consent_type: str  # "essential" | "analytics"
    granted: bool
    ip_address_hash: Optional[str] = None  # SHA-256 hex, never raw IP
    user_agent: Optional[str] = None
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    revoked_at: Optional[datetime] = None


class DataDeletionRequest(SQLModel, table=True):
    __tablename__ = "data_deletion_request"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = "pending"  # pending | processing | completed | failed
