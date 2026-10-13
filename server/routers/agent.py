from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from models import User
from schemas import AgentChatRequest, AgentChatResponse
from services.agent_service import chat_with_agent

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", response_model=AgentChatResponse)
async def chat_agent(
	data: AgentChatRequest,
	current_user: User = Depends(get_current_user),
):
	try:
		# Thread is server-scoped per user; the client may only append a
		# per-tab suffix (validated) so each tab starts fresh without ever
		# reaching another user's thread.
		raw_suffix = data.thread_id or ""
		suffix = raw_suffix if raw_suffix and len(raw_suffix) <= 32 and raw_suffix.replace("-", "").replace("_", "").isalnum() else "default"
		thread_id = f"user-{current_user.id}-{suffix}"
		user = {
			"id": current_user.id,
			"name": current_user.name,
			"email": current_user.email,
			"role": current_user.role,
		}
		response = await chat_with_agent(data.message, thread_id=thread_id, user=user)
		return AgentChatResponse(response=response)
	except RuntimeError as exc:
		raise HTTPException(status_code=500, detail=str(exc)) from exc
	except Exception as exc:
		# Catch-all stays inside CORS middleware so the widget gets JSON,
		# not a connection reset (ServerErrorMiddleware sends no CORS headers).
		raise HTTPException(status_code=500, detail=f"Agent error: {exc}") from exc
