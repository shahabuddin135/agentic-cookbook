import json
import re
from uuid import uuid4
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner
from app.auth.jwt_verify import get_current_user
from app.database import AsyncSessionDep
from app.models.conversation import Conversation
from app.models.message import Message
from app.agent.agent import create_recipe_agent
from app.agent.guardrails import check_input_guardrails, check_output_guardrails
from app.middleware.rate_limit import check_rate_limit

router = APIRouter(prefix="/agent", tags=["agent"])


def extract_recipe_payload(raw) -> dict:
    """Extract the recipe JSON object from the agent's final output.

    LLMs frequently wrap JSON in ```json fences or surround it with prose
    despite instructions, so a naive json.loads() fails and the recipe is lost.
    This strips fences, tries a direct parse, then falls back to scanning for the
    first balanced {...} object. If nothing parses, returns a message-only payload.
    """
    if not isinstance(raw, str):
        return {"message": str(raw), "recipe": None, "image": None}

    text = raw.strip()

    # Strip a ```json ... ``` (or plain ```) code fence if present.
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    parsed = None
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        # Fall back to the first balanced top-level object.
        start = text.find("{")
        if start != -1:
            depth = 0
            for i in range(start, len(text)):
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                    if depth == 0:
                        try:
                            parsed = json.loads(text[start : i + 1])
                        except json.JSONDecodeError:
                            parsed = None
                        break

    if not isinstance(parsed, dict):
        return {"message": text, "recipe": None, "image": None}

    parsed.setdefault("message", "")
    parsed.setdefault("recipe", None)
    parsed.setdefault("image", None)
    return parsed


def _tool_display_name(item) -> str:
    """Best-effort tool name from a ToolCallItem (function tools and MCP tools differ)."""
    raw = getattr(item, "raw_item", None)
    name = getattr(raw, "name", None)
    if not name and isinstance(raw, dict):
        name = raw.get("name") or raw.get("type")
    return (name or getattr(item, "title", None) or "").lower()


def _is_photo_tool(name: str) -> bool:
    return any(k in name for k in ("photo", "image", "pexels"))


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

@router.post("/chat")
async def agent_chat(
    body: ChatRequest,
    request: Request,
    db: AsyncSessionDep,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    check_rate_limit(user_id)
    mcp_servers = request.app.state.mcp_servers

    # Pre-stream DB writes
    conv_id = body.conversation_id
    if not conv_id:
        conv_id = str(uuid4())
        conv = Conversation(id=conv_id, user_id=user_id, title=body.message[:60])
        db.add(conv)
        await db.commit()

    user_msg_id = str(uuid4())
    user_msg = Message(id=user_msg_id, conversation_id=conv_id,
                       role="user", content=body.message)
    db.add(user_msg)
    await db.commit()

    async def event_stream():
        try:
            input_err = check_input_guardrails(body.message)
            if input_err:
                yield _sse({"type": "status", "message": "Analyzing request…"})
                parsed = {"message": input_err, "recipe": None, "image": None}
            else:
                agent = create_recipe_agent(mcp_servers)
                result = Runner.run_streamed(agent, input=body.message)

                last_status = "Searching for the perfect recipe…"
                yield _sse({"type": "status", "message": last_status})

                async for event in result.stream_events():
                if event.type == "run_item_stream_event" and event.name == "tool_called":
                    name = _tool_display_name(event.item)
                    msg = (
                        "Finding a beautiful photo…"
                        if _is_photo_tool(name)
                        else "Finding ingredients & steps…"
                    )
                    if msg != last_status:
                        last_status = msg
                        yield _sse({"type": "status", "message": msg})
                elif hasattr(event, "name") and event.name in ("content_chunk", "text_chunk", "model_output"):
                    if last_status != "Writing your recipe…":
                        last_status = "Writing your recipe…"
                        yield _sse({"type": "status", "message": last_status})
                    chunk_text = getattr(event, "data", None) or getattr(event, "text", None) or getattr(event, "content", None)
                    if chunk_text and isinstance(chunk_text, str):
                        yield _sse({"type": "chunk", "text": chunk_text})
                elif not hasattr(event, "name"):
                    # Fallback for other streaming events
                    if last_status not in ("Writing your recipe…", "Finding a beautiful photo…", "Finding ingredients & steps…"):
                        last_status = "Writing your recipe…"
                        yield _sse({"type": "status", "message": last_status})

                yield _sse({"type": "status", "message": "Plating your recipe…"})
                
                out_err = check_output_guardrails(result.final_output)
                if out_err:
                    parsed = {"message": out_err, "recipe": None, "image": None}
                else:
                    parsed = extract_recipe_payload(result.final_output)

            assistant_msg_id = str(uuid4())
            assistant_msg = Message(
                id=assistant_msg_id,
                conversation_id=conv_id,
                role="assistant",
                content=parsed.get("message", ""),
                image_url=(parsed.get("image") or {}).get("url"),
                metadata_=parsed,
            )
            db.add(assistant_msg)
            await db.commit()

            yield _sse({
                "type": "recipe",
                "data": parsed,
                "conversation_id": conv_id,
                "message_id": assistant_msg_id,
            })
            yield _sse({"type": "done"})

        except Exception as exc:
            yield _sse({"type": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
