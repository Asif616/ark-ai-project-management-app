import datetime
import os
from typing import Any

from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver

from services.agent_tools import AGENT_TOOLS_ADMIN, AGENT_TOOLS_USER, set_actor

SYSTEM_PROMPT = (
    "You are ARK AI, the assistant inside the ARK project management app. "
    "Greetings, thanks, goodbyes, and other brief social exchanges are fine — "
    "respond warmly and briefly, then offer to help with their workspace. "
    "For substantive questions, answer only about projects, tasks, users, dashboards, "
    "or the app itself; for anything else reply: \"I can only answer questions related "
    "to project management and the ARK application.\"\n\n"
    "Use your tools for any data. Never invent IDs, statuses, dates, or values — if a tool "
    "does not return it, say it is unavailable. Ask a specific follow-up when information "
    "is missing.\n\n"
    "Keep answers direct. Use tables for lists and bullets for summaries. Call out delays, "
    "risks, and unassigned work when you see them. After create/update/delete actions, state "
    "exactly what changed. End by asking what to do next.\n\n"
    "Today's date is {date}."
    "{role_guard}\n\n"
    "Task status must be exactly one of: todo, in_progress, review, done "
    "(priority: low, medium, high). Map the user's words to these — e.g. "
    "'completed'/'finished' means done, 'started' means in_progress. Never "
    "invent another status; if none fits, ask which of the four they mean."
)

USER_ROLE_GUARD = (
    "\n\nThe person you are talking to has the 'user' role, not admin: you cannot "
    "create/update/delete users, update/delete projects, or delete tasks — those tools "
    "are not available to you. Refuse such requests briefly and say an admin is required."
)


def _identity_block(user: dict) -> str:
    return (
        f"You are talking to {user.get('name')} ({user.get('email')}), "
        f"user_id={user.get('id')}, role={user.get('role')}. Never ask who they are — "
        f"resolve 'me'/'my' to user_id={user.get('id')} (use my_tasks_tool for their tasks)."
    )


# ponytail: 2 cached agents (admin/user); per-user instances if this ever matters.
_agents: dict[str, Any] = {}
_memory = MemorySaver()


def _build_agent(role: str) -> Any:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not found")

    is_admin = role == "admin"
    return create_agent(
        model=ChatGroq(model="openai/gpt-oss-120b", api_key=api_key, temperature=0),
        tools=AGENT_TOOLS_ADMIN if is_admin else AGENT_TOOLS_USER,
        checkpointer=_memory,
        system_prompt=SYSTEM_PROMPT.format(
            date=datetime.date.today().isoformat(),
            role_guard="" if is_admin else USER_ROLE_GUARD,
        ),
    )


def _extract_text(result: Any) -> str:
    messages = result.get("messages", []) if isinstance(result, dict) else []
    if not messages:
        return ""

    content = getattr(messages[-1], "content", "")
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        return "\n".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()

    return str(content).strip()


async def chat_with_agent(message: str, thread_id: str, user: dict) -> str:
    if not message.strip():
        raise ValueError("Message cannot be empty")

    role = "admin" if user.get("role") == "admin" else "user"
    if role not in _agents:
        _agents[role] = _build_agent(role)
    set_actor(user)

    result = await _agents[role].ainvoke(
        {
            "messages": [
                {"role": "system", "content": _identity_block(user)},
                {"role": "user", "content": message},
            ]
        },
        config={"configurable": {"thread_id": thread_id}},
    )
    return _extract_text(result)
