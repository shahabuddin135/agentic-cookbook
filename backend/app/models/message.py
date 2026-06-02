from datetime import datetime
from typing import Optional, Any
from uuid import uuid4

from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Message(SQLModel, table=True):
    __tablename__ = "message"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    conversation_id: str = Field(index=True)
    role: str  # "user" | "assistant"
    content: str
    image_url: Optional[str] = None
    metadata_: Optional[Any] = Field(
        default=None,
        sa_column=Column("metadata", JSON),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
