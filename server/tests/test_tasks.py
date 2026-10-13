"""tasks_service CRUD, filters, comments, and not-found paths."""

from datetime import date, timedelta

import pytest

from schemas import CommentCreate, TaskCreate, TaskUpdate
from services import tasks_service


def _make_task(db, project, **over):
    data = TaskCreate(title="Ship it", project_id=project.id, **over)
    return tasks_service.create_task(db, data)


def test_create_maps_synonyms(db, project):
    task = _make_task(db, project, status="completed", priority="urgent")
    assert task.status == "done"
    assert task.priority == "high"


def test_create_invalid_status_raises(db, project):
    with pytest.raises(ValueError, match="Invalid status"):
        _make_task(db, project, status="bogus")


def test_get_missing_raises(db):
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.get_task(db, 9999)


def test_list_filters(db, project, user):
    t1 = _make_task(db, project, assignee_id=user.id)
    _make_task(db, project)
    assert len(tasks_service.list_tasks(db)) == 2
    assert [t.id for t in tasks_service.list_tasks(db, assignee_id=user.id)] == [t1.id]
    assert [t.id for t in tasks_service.list_tasks(db, project_id=project.id)] != []


def test_list_overdue_excludes_done(db, project):
    past = date.today() - timedelta(days=1)
    open_task = _make_task(db, project, due_date=past)
    done_task = _make_task(db, project, due_date=past, status="done")
    ids = [t.id for t in tasks_service.list_tasks(db, overdue=True)]
    assert open_task.id in ids
    assert done_task.id not in ids


def test_update_status_logs_and_normalizes(db, project):
    task = _make_task(db, project)
    updated = tasks_service.update_task(db, task.id, TaskUpdate(status="finished"))
    assert updated.status == "done"


def test_update_missing_raises(db):
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.update_task(db, 9999, TaskUpdate(title="x"))


def test_delete_and_missing(db, project):
    task = _make_task(db, project)
    tasks_service.delete_task(db, task.id)
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.get_task(db, task.id)
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.delete_task(db, task.id)


def test_comments_roundtrip(db, project, user):
    task = _make_task(db, project, assignee_id=user.id)
    comment = tasks_service.create_comment(
        db, task.id, CommentCreate(body="  looks good  "), actor=user
    )
    assert comment.body == "looks good"
    assert comment.author_name == user.name
    listed = tasks_service.list_comments(db, task.id)
    assert [c.id for c in listed] == [comment.id]


def test_comments_missing_task(db, user):
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.list_comments(db, 9999)
    with pytest.raises(LookupError, match="Task not found"):
        tasks_service.create_comment(db, 9999, CommentCreate(body="hi"), actor=user)
