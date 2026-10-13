from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)

AVATAR_COLORS = [
    "#7C3AED", "#8B5CF6", "#6D28D9", "#5B21B6",
    "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
    "#EF4444", "#06B6D4", "#84CC16", "#F97316",
]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    supabase_user_id = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False, default="SUPABASE_MANAGED")
    role = Column(String(20), default="user", nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    avatar_color = Column(String(7), default=AVATAR_COLORS[0])
    created_at = Column(DateTime, default=utcnow)

    assigned_tasks = relationship("Task", back_populates="assignee")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=utcnow)

    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    status = Column(String(20), default="todo", nullable=False)
    priority = Column(String(20), default="medium", nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    task = relationship("Task", back_populates="comments")
    author = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(String(500), nullable=False)
    link = Column(String(500), default="")
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])


class Activity(Base):
    __tablename__ = "activity"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    verb = Column(String(50), nullable=False)
    detail = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=utcnow)

    actor = relationship("User")
