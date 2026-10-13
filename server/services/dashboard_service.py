from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models import Activity, Project, Task, User
from schemas import ActivityResponse, DashboardStats


def list_activity(db: Session, project_id: int | None = None, limit: int = 12) -> list[ActivityResponse]:
    query = db.query(Activity)
    if project_id is not None:
        query = query.filter(Activity.project_id == project_id)
    rows = query.options(joinedload(Activity.actor)).order_by(Activity.created_at.desc()).limit(limit).all()
    return [
        ActivityResponse(
            id=row.id,
            verb=row.verb,
            detail=row.detail,
            actor_name=row.actor.name if row.actor else None,
            project_id=row.project_id,
            task_id=row.task_id,
            created_at=row.created_at,
        )
        for row in rows
    ]


def get_dashboard_stats(db: Session) -> DashboardStats:
    total_projects = db.query(Project).count()
    total_users = db.query(User).count()

    task_counts = dict(db.query(Task.status, func.count()).group_by(Task.status).all())
    total_tasks = sum(task_counts.values())
    todo_tasks = task_counts.get("todo", 0)
    in_progress_tasks = task_counts.get("in_progress", 0)
    review_tasks = task_counts.get("review", 0)
    completed_tasks = task_counts.get("done", 0)

    completion_percentage = (
        round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0
    )

    today = date.today()
    overdue_tasks = (
        db.query(Task).filter(Task.due_date < today, Task.status != "done").count()
    )
    due_soon_tasks = (
        db.query(Task)
        .filter(Task.due_date >= today, Task.due_date <= today + timedelta(days=7), Task.status != "done")
        .count()
    )

    tasks_by_status = {
        "To Do": todo_tasks,
        "In Progress": in_progress_tasks,
        "Review": review_tasks,
        "Done": completed_tasks,
    }

    project_counts = dict(db.query(Project.status, func.count()).group_by(Project.status).all())

    projects_by_status = {
        "Active": project_counts.get("active", 0),
        "Completed": project_counts.get("completed", 0),
        "On Hold": project_counts.get("on_hold", 0),
    }

    recent_tasks_query = (
        db.query(Task)
        .options(joinedload(Task.assignee), joinedload(Task.project))
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )
    recent_tasks = [
        {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "project_name": task.project.name if task.project else "Unknown",
            "assignee_name": task.assignee.name if task.assignee else None,
        }
        for task in recent_tasks_query
    ]

    return DashboardStats(
        total_projects=total_projects,
        total_tasks=total_tasks,
        total_users=total_users,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        todo_tasks=todo_tasks,
        review_tasks=review_tasks,
        completion_percentage=completion_percentage,
        tasks_by_status=tasks_by_status,
        projects_by_status=projects_by_status,
        recent_tasks=recent_tasks,
        overdue_tasks=overdue_tasks,
        due_soon_tasks=due_soon_tasks,
    )
