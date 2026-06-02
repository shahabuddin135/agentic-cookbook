from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.auth.jwt_verify import get_current_user
from app.database import AsyncSessionDep
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("")
async def list_conversations(
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Conversation).where(
        Conversation.user_id == current_user["user_id"]
    ).order_by(Conversation.updated_at.desc())
    result = await db.exec(stmt)
    return {"conversations": result.all()}

@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")

    stmt = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc())
    result = await db.exec(stmt)
    return {"conversation": conv, "messages": result.all()}

@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
