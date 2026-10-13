from datetime import date

from sqlalchemy.orm import Session

from models import Activity, Notification, Task, TaskComment, User
from schemas import CommentCreate, CommentResponse, TaskCreate, TaskResponse, TaskUpdate

STATUS_LABELS = {"todo": "To Do", "in_progress": "In Progress", "review": "Review", "done": "Done"}

TASK_STATUSES = tuple(STATUS_LABELS)
TASK_PRIORITIES = ("low", "medium", "high")

# Human words mapped to canonical values ("completed" -> "done").
STATUS_SYNONYMS = {
    "to do": "todo",
    "todo": "todo",
    "pending": "todo",
    "new": "todo",
    "in progress": "in_progress",
    "inprogress": "in_progress",
    "started": "in_progress",
    "begun": "in_progress",
    "doing": "in_progress",
    "in review": "review",
    "reviewing": "review",
    "completed": "done",
    "complete": "done",
    "finished": "done",
    "finish": "done",
    "closed": "done",
    "close": "done",
}
PRIORITY_SYNONYMS = {
    "urgent": "high",
    "critical": "high",
    "important": "high",
    "normal": "medium",
    "average": "medium",
    "minor": "low",
    "trivial": "low",
}


def _normalize(value: str, synonyms: dict, valid: tuple, field: str) -> str:
    key = " ".join(str(value).lower().split())
    canonical = synonyms.get(key, key).replace(" ", "_")
    if canonical not in valid:
        raise ValueError(f"Invalid {field} {value!r}. Must be one of: {', '.join(valid)}.")
    return canonical


def normalize_status(value: str) -> str:
    return _normalize(value, STATUS_SYNONYMS, TASK_STATUSES, "status")


def normalize_priority(value: str) -> str:
    return _normalize(value, PRIORITY_SYNONYMS, TASK_PRIORITIES, "priority")


def _task_to_response(task: Task) -> TaskResponse:
    response = TaskResponse.model_validate(task)
    if task.assignee is not None:
        response.assignee_name = task.assignee.name
        response.assignee_avatar_color = task.assignee.avatar_color
    return response


def _log_activity(db: Session, actor: User | None, task: Task, verb: str, detail: str) -> None:
    db.add(Activity(actor_id=actor.id if actor else None, project_id=task.project_id, task_id=task.id, verb=verb, detail=detail))


def _notify(db: Session, user_id: int, actor: User | None, message: str, link: str) -> None:
    db.add(Notification(user_id=user_id, actor_id=actor.id if actor else None, message=message, link=link))


def list_tasks(
    db: Session,
    project_id: int | None = None,
    assignee_id: int | None = None,
    overdue: bool = False,
) -> list[TaskResponse]:
    query = db.query(Task)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    if assignee_id is not None:
        query = query.filter(Task.assignee_id == assignee_id)
    if overdue:
        query = query.filter(Task.due_date < date.today(), Task.status != "done")

    tasks = query.order_by(Task.created_at.desc()).all()
    return [_task_to_response(task) for task in tasks]


def get_task(db: Session, task_id: int) -> TaskResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise LookupError("Task not found")
    return _task_to_response(task)


def create_task(db: Session, data: TaskCreate, actor: User | None = None) -> TaskResponse:
    payload = data.model_dump()
    payload["status"] = normalize_status(payload.get("status") or "todo")
    payload["priority"] = normalize_priority(payload.get("priority") or "medium")
    task = Task(**payload)
    db.add(task)
    db.flush()
    _log_activity(db, actor, task, "created", f'created task "{task.title}"')
    if task.assignee_id and (actor is None or task.assignee_id != actor.id):
        _notify(db, task.assignee_id, actor, f'You were assigned "{task.title}"', f"/projects/{task.project_id}")
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


def update_task(db: Session, task_id: int, data: TaskUpdate, actor: User | None = None) -> TaskResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise LookupError("Task not found")

    changes = data.model_dump(exclude_unset=True)
    if "status" in changes:
        changes["status"] = normalize_status(changes["status"])
    if "priority" in changes:
        changes["priority"] = normalize_priority(changes["priority"])
    old_assignee, old_status = task.assignee_id, task.status

    for field, value in changes.items():
        setattr(task, field, value)

    if "status" in changes and task.status != old_status:
        _log_activity(db, actor, task, "moved", f'moved "{task.title}" to {STATUS_LABELS.get(task.status, task.status)}')
    elif "assignee_id" in changes and task.assignee_id != old_assignee:
        _log_activity(db, actor, task, "assigned", f'reassigned "{task.title}"')
    elif "title" in changes or "due_date" in changes or "priority" in changes:
        _log_activity(db, actor, task, "updated", f'updated "{task.title}"')

    if "assignee_id" in changes and task.assignee_id and task.assignee_id != old_assignee:
        if actor is None or task.assignee_id != actor.id:
            _notify(db, task.assignee_id, actor, f'You were assigned "{task.title}"', f"/projects/{task.project_id}")

    db.commit()
    db.refresh(task)
    return _task_to_response(task)


def delete_task(db: Session, task_id: int) -> None:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise LookupError("Task not found")

    # ponytail: explicit null for SQLite (no FK enforcement / no SET NULL there)
    db.query(Activity).filter(Activity.task_id == task_id).update({Activity.task_id: None}, synchronize_session=False)
    db.delete(task)
    db.commit()


def list_comments(db: Session, task_id: int) -> list[CommentResponse]:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise LookupError("Task not found")
    rows = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
    return [_comment_to_response(row) for row in rows]


def create_comment(db: Session, task_id: int, data: CommentCreate, actor: User) -> CommentResponse:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise LookupError("Task not found")

    row = TaskComment(task_id=task_id, author_id=actor.id, body=data.body.strip())
    db.add(row)
    _log_activity(db, actor, task, "commented", f'commented on "{task.title}"')
    if task.assignee_id and task.assignee_id != actor.id:
        _notify(db, task.assignee_id, actor, f'{actor.name} commented on "{task.title}"', f"/projects/{task.project_id}")
    db.commit()
    db.refresh(row)
    return _comment_to_response(row)


def _comment_to_response(row: TaskComment) -> CommentResponse:
    response = CommentResponse.model_validate(row)
    if row.author is not None:
        response.author_name = row.author.name
        response.author_avatar_color = row.author.avatar_color
    return response
