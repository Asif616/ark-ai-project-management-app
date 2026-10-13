from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

from langchain_core.tools import tool

from database import SessionLocal
from models import User
from schemas import (
    ProjectCreate,
    ProjectUpdate,
    TaskCreate,
    TaskUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from services.dashboard_service import get_dashboard_stats
from services.projects_service import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)
from services.tasks_service import create_task, delete_task, get_task, list_tasks, update_task
from services.users_service import create_user, delete_user, get_user, list_users, update_user


@contextmanager
def _db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _json(value: Any) -> Any:
    # Groq rejects empty tool-message content, so never return blank results.
    if value is None or value == "" or value == [] or value == {}:
        return "No results found."
    if isinstance(value, User):
        return UserResponse.model_validate(value).model_dump(mode="json")
    if isinstance(value, list):
        return [_json(item) for item in value]
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return value


def _call(fn, *args, **kwargs):
    with _db_session() as db:
        return _json(fn(db, *args, **kwargs))


# Caller set per request by routers/agent.py; tools read it instead of
# trusting LLM-supplied ids.
_actor: ContextVar[dict | None] = ContextVar("ark_actor", default=None)


def set_actor(actor: dict | None) -> None:
    _actor.set(actor)


@tool
def list_users_tool() -> list[dict[str, Any]]:
    """List users ordered by newest first."""
    return _call(list_users)


@tool
def create_user_tool(data: UserCreate) -> dict[str, Any]:
    """Create a user."""
    return _call(create_user, data)


@tool
def get_user_tool(user_id: int) -> dict[str, Any]:
    """Get one user by id."""
    return _call(get_user, user_id)


@tool
def update_user_tool(user_id: int, data: UserUpdate) -> dict[str, Any]:
    """Update a user by id."""
    return _call(update_user, user_id, data)


@tool
def delete_user_tool(user_id: int) -> dict[str, str]:
    """Delete a user by id."""
    return _call(delete_user, user_id)


@tool
def list_projects_tool() -> list[dict[str, Any]]:
    """List projects ordered by newest first."""
    return _call(list_projects)


@tool
def get_project_tool(project_id: int) -> dict[str, Any]:
    """Get one project by id."""
    return _call(get_project, project_id)


@tool
def create_project_tool(data: ProjectCreate) -> dict[str, Any]:
    """Create a project."""
    return _call(create_project, data)


@tool
def update_project_tool(project_id: int, data: ProjectUpdate) -> dict[str, Any]:
    """Update a project by id."""
    return _call(update_project, project_id, data)


@tool
def delete_project_tool(project_id: int) -> dict[str, str]:
    """Delete a project by id."""
    return _call(delete_project, project_id)


@tool
def list_tasks_tool(
    project_id: int | None = None, assignee_id: int | None = None
) -> list[dict[str, Any]]:
    """List tasks, optionally filtered by project_id or assignee_id."""
    return _call(list_tasks, project_id=project_id, assignee_id=assignee_id)


@tool
def my_tasks_tool() -> list[dict[str, Any]]:
    """List tasks assigned to the person you are talking to. Use for 'my tasks'."""
    actor = _actor.get()
    if not actor:
        return []
    return _call(list_tasks, assignee_id=actor["id"])


@tool
def get_task_tool(task_id: int) -> dict[str, Any]:
    """Get one task by id."""
    return _call(get_task, task_id)


@tool
def create_task_tool(data: TaskCreate) -> dict[str, Any]:
    """Create a task. Status must be todo/in_progress/review/done (e.g. completed -> done); priority low/medium/high."""
    return _call(create_task, data)


@tool
def update_task_tool(task_id: int, data: TaskUpdate) -> dict[str, Any]:
    """Update a task by id. Status must be todo/in_progress/review/done (e.g. completed -> done); never invent other statuses."""
    return _call(update_task, task_id, data)


@tool
def delete_task_tool(task_id: int) -> dict[str, str]:
    """Delete a task by id."""
    return _call(delete_task, task_id)


@tool
def get_dashboard_stats_tool() -> dict[str, Any]:
    """Get dashboard stats."""
    return _call(get_dashboard_stats)


AGENT_TOOLS = [
    list_users_tool,
    create_user_tool,
    get_user_tool,
    update_user_tool,
    delete_user_tool,
    list_projects_tool,
    get_project_tool,
    create_project_tool,
    update_project_tool,
    delete_project_tool,
    list_tasks_tool,
    my_tasks_tool,
    get_task_tool,
    create_task_tool,
    update_task_tool,
    delete_task_tool,
    get_dashboard_stats_tool,
]

# Mirrors the admin-only REST endpoints; user-role callers never receive
# these tools so the refusal is enforced, not just prompted.
_ADMIN_ONLY_TOOL_NAMES = {
    "create_user_tool",
    "update_user_tool",
    "delete_user_tool",
    "update_project_tool",
    "delete_project_tool",
    "delete_task_tool",
}

AGENT_TOOLS_ADMIN = AGENT_TOOLS
AGENT_TOOLS_USER = [t for t in AGENT_TOOLS if t.name not in _ADMIN_ONLY_TOOL_NAMES]
