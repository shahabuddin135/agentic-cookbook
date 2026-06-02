import json
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select
from app.auth.jwt_verify import get_current_user
from app.database import AsyncSessionDep
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.compliance import DataDeletionRequest

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileUpdate(BaseModel):
    name: str

@router.get("/export")
async def export_data(
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]

    # Fetch user
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch all conversations
    conv_stmt = select(Conversation).where(Conversation.user_id == user_id)
    convs = (await db.exec(conv_stmt)).all()

    # Fetch all messages for each conversation
    conversations_export = []
    for conv in convs:
        msg_stmt = select(Message).where(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at.asc())
        messages = (await db.exec(msg_stmt)).all()
        conversations_export.append({
            **conv.model_dump(),
            "messages": [m.model_dump() for m in messages],
        })

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "created_at": user.created_at.isoformat()},
        "conversations": conversations_export,
    }

    json_bytes = json.dumps(export_data, default=str).encode("utf-8")

    return StreamingResponse(
        iter([json_bytes]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=my-data.json"},
    )

@router.get("")
async def get_profile(
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    user = await db.get(User, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email,
            "created_at": user.created_at}

@router.put("")
async def update_profile(
    body: ProfileUpdate,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    if not body.name.strip():
        raise HTTPException(status_code=422, detail="Name cannot be empty")
        
    user = await db.get(User, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = body.name
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email,
            "created_at": user.created_at}

@router.delete("", status_code=202)
async def request_deletion(
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]

    req = DataDeletionRequest(
        id=str(uuid4()),
        user_id=user_id,
        status="pending",
    )
    db.add(req)
    await db.commit()

    return {"message": "Deletion scheduled. Account will be removed within 30 days."}
