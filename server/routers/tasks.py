from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import User
from schemas import CommentCreate, CommentResponse, TaskCreate, TaskResponse, TaskUpdate
from services import tasks_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    project_id: Optional[int] = Query(None),
    assignee_id: Optional[int] = Query(None),
    overdue: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tasks_service.list_tasks(db, project_id=project_id, assignee_id=assignee_id, overdue=overdue)


@router.post("/", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tasks_service.create_task(db, data, actor=current_user)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tasks_service.update_task(db, task_id, data, actor=current_user)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    tasks_service.delete_task(db, task_id)
    return {"detail": "Task deleted"}


@router.get("/{task_id}/comments", response_model=List[CommentResponse])
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tasks_service.list_comments(db, task_id)


@router.post("/{task_id}/comments", response_model=CommentResponse)
def create_comment(
    task_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tasks_service.create_comment(db, task_id, data, actor=current_user)
