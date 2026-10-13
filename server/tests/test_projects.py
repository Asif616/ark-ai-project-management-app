"""projects_service CRUD, progress math, and not-found paths."""

import pytest

from schemas import ProjectCreate, ProjectUpdate, TaskCreate
from services import projects_service, tasks_service


def test_create_and_get(db):
    created = projects_service.create_project(db, ProjectCreate(name="Apollo"))
    assert created.task_count == 0
    assert created.progress == 0
    assert projects_service.get_project(db, created.id).name == "Apollo"


def test_get_missing_raises(db):
    with pytest.raises(LookupError, match="Project not found"):
        projects_service.get_project(db, 9999)


def test_progress_math(db):
    project = projects_service.create_project(db, ProjectCreate(name="P"))
    tasks_service.create_task(db, TaskCreate(title="a", project_id=project.id, status="done"))
    tasks_service.create_task(db, TaskCreate(title="b", project_id=project.id, status="todo"))
    fetched = projects_service.get_project(db, project.id)
    assert fetched.task_count == 2
    assert fetched.progress == 50.0


def test_list_newest_first(db):
    first = projects_service.create_project(db, ProjectCreate(name="first"))
    second = projects_service.create_project(db, ProjectCreate(name="second"))
    ids = [p.id for p in projects_service.list_projects(db)]
    assert ids == [second.id, first.id]


def test_update_missing_raises(db):
    with pytest.raises(LookupError, match="Project not found"):
        projects_service.update_project(db, 9999, ProjectUpdate(name="x"))


def test_update_and_delete(db):
    project = projects_service.create_project(db, ProjectCreate(name="old"))
    updated = projects_service.update_project(db, project.id, ProjectUpdate(status="completed"))
    assert updated.status == "completed"
    projects_service.delete_project(db, project.id)
    with pytest.raises(LookupError, match="Project not found"):
        projects_service.get_project(db, project.id)
    with pytest.raises(LookupError, match="Project not found"):
        projects_service.delete_project(db, project.id)


def test_counts_empty_ids(db):
    assert projects_service._counts_by_project(db, []) == {}
