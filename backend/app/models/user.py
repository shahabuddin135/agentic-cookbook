from datetime import datetime
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "user"
    __table_args__ = {'extend_existing': True}

    id: str = Field(primary_key=True)
    name: str
    email: str
    created_at: datetime
