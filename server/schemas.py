from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class _Response(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- User ---
class UserCreate(_Response):
    name: str
    email: str
    password: str
    role: str = "user"
    avatar_color: str = "#7C3AED"


class UserUpdate(_Response):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar_color: Optional[str] = None


class UserResponse(_Response):
    id: int
    name: str
    email: str
    role: str
    must_change_password: bool = False
    avatar_color: str
    created_at: datetime


# --- Project ---
class ProjectCreate(_Response):
    name: str
    description: str = ""
    status: str = "active"


class ProjectUpdate(_Response):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(_Response):
    id: int
    name: str
    description: str
    status: str
    created_at: datetime
    task_count: int = 0
    progress: float = 0


# --- Task ---
class TaskCreate(_Response):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


class TaskUpdate(_Response):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(_Response):
    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: int
    assignee_id: Optional[int]
    assignee_name: Optional[str] = None
    assignee_avatar_color: Optional[str] = None
    due_date: Optional[date] = None
    created_at: datetime


# --- Comments ---
class CommentCreate(_Response):
    body: str = Field(min_length=1, max_length=4000)


class CommentResponse(_Response):
    id: int
    task_id: int
    author_id: int
    author_name: Optional[str] = None
    author_avatar_color: Optional[str] = None
    body: str
    created_at: datetime


# --- Notifications ---
class NotificationResponse(_Response):
    id: int
    message: str
    link: str
    is_read: bool
    actor_name: Optional[str] = None
    created_at: datetime


# --- Activity ---
class ActivityResponse(_Response):
    id: int
    verb: str
    detail: str
    actor_name: Optional[str] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    created_at: datetime


# --- Dashboard ---
class DashboardStats(_Response):
    total_projects: int
    total_tasks: int
    total_users: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    review_tasks: int
    completion_percentage: float
    tasks_by_status: dict
    projects_by_status: dict
    recent_tasks: list
    overdue_tasks: int = 0
    due_soon_tasks: int = 0


# --- Agent ---
class AgentChatRequest(_Response):
    message: str
    thread_id: Optional[str] = None


class AgentChatResponse(_Response):
    response: str
