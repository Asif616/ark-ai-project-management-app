"""dashboard_service stats math and activity feed."""

from datetime import date, timedelta

from models import Project, Task, User
from schemas import ProjectCreate, TaskCreate
from services import dashboard_service, projects_service, tasks_service


def test_empty_db_zeros(db):
    stats = dashboard_service.get_dashboard_stats(db)
    assert (stats.total_projects, stats.total_tasks, stats.total_users) == (0, 0, 0)
    assert stats.completion_percentage == 0
    assert stats.overdue_tasks == 0
    assert dashboard_service.list_activity(db) == []


def test_stats_counts(db, project):
    db.add(User(name="U", email="u@x.com", hashed_password="x", role="user"))
    db.commit()
    today = date.today()
    tasks_service.create_task(db, TaskCreate(title="t1", project_id=project.id, status="todo"))
    tasks_service.create_task(
        db, TaskCreate(title="t2", project_id=project.id, status="in_progress")
    )
    tasks_service.create_task(db, TaskCreate(title="t3", project_id=project.id, status="done"))
    tasks_service.create_task(
        db,
        TaskCreate(title="late", project_id=project.id, due_date=today - timedelta(days=1)),
    )
    tasks_service.create_task(
        db,
        TaskCreate(title="soon", project_id=project.id, due_date=today + timedelta(days=3)),
    )

    stats = dashboard_service.get_dashboard_stats(db)
    assert stats.total_tasks == 5
    assert stats.todo_tasks == 3  # t1 + late + soon default to todo
    assert stats.in_progress_tasks == 1
    assert stats.completed_tasks == 1
    assert stats.completion_percentage == 20.0
    assert stats.overdue_tasks == 1  # done-but-late excluded, tested in test_tasks
    assert stats.due_soon_tasks == 1
    assert stats.tasks_by_status == {"To Do": 3, "In Progress": 1, "Review": 0, "Done": 1}
    assert stats.projects_by_status["Active"] == 1
    assert len(stats.recent_tasks) == 5
    assert stats.total_users == 1


def test_activity_filter_and_limit(db):
    p1 = projects_service.create_project(db, ProjectCreate(name="p1"))
    p2 = projects_service.create_project(db, ProjectCreate(name="p2"))
    tasks_service.create_task(db, TaskCreate(title="t", project_id=p1.id))
    assert len(dashboard_service.list_activity(db)) >= 3
    only_p2 = dashboard_service.list_activity(db, project_id=p2.id)
    assert all(a.project_id == p2.id for a in only_p2)
    assert len(dashboard_service.list_activity(db, limit=1)) == 1


def test_recent_task_unknown_project_shape(db):
    db.add(Task(title="orphan", project_id=9999, status="todo", priority="low"))
    db.add(Project(name="p", status="active"))
    db.commit()
    stats = dashboard_service.get_dashboard_stats(db)
    assert any(t["project_name"] == "Unknown" for t in stats.recent_tasks)
