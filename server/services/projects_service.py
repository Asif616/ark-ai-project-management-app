from sqlalchemy import case, func
from sqlalchemy.orm import Session

from models import Activity, Project, Task, User
from schemas import ProjectCreate, ProjectResponse, ProjectUpdate


def _counts_by_project(db: Session, project_ids: list[int]) -> dict[int, tuple[int, int]]:
    if not project_ids:
        return {}
    # ponytail: CASE not bare boolean - sum() over a boolean coerces to True/False
    done = func.sum(case((Task.status == "done", 1), else_=0))
    rows = (
        db.query(Task.project_id, func.count(), done)
        .filter(Task.project_id.in_(project_ids))
        .group_by(Task.project_id)
        .all()
    )
    return {project_id: (total, done_count or 0) for project_id, total, done_count in rows}


def _project_to_response(project: Project, counts: tuple[int, int] = (0, 0)) -> ProjectResponse:
    response = ProjectResponse.model_validate(project)
    task_count, done_count = counts
    response.task_count = task_count
    response.progress = round((done_count / task_count) * 100, 1) if task_count else 0
    return response


def list_projects(db: Session) -> list[ProjectResponse]:
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    counts = _counts_by_project(db, [project.id for project in projects])
    return [_project_to_response(project, counts.get(project.id, (0, 0))) for project in projects]


def get_project(db: Session, project_id: int) -> ProjectResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise LookupError("Project not found")
    return _project_to_response(project, _counts_by_project(db, [project_id]).get(project_id, (0, 0)))


def create_project(db: Session, data: ProjectCreate, actor: User | None = None) -> ProjectResponse:
    project = Project(**data.model_dump())
    db.add(project)
    db.flush()
    db.add(Activity(actor_id=actor.id if actor else None, project_id=project.id, verb="created", detail=f'created project "{project.name}"'))
    db.commit()
    db.refresh(project)
    return _project_to_response(project, _counts_by_project(db, [project.id]).get(project.id, (0, 0)))


def update_project(db: Session, project_id: int, data: ProjectUpdate, actor: User | None = None) -> ProjectResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise LookupError("Project not found")

    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(project, field, value)

    if "status" in changes:
        db.add(Activity(actor_id=actor.id if actor else None, project_id=project.id, verb="updated", detail=f'set "{project.name}" to {project.status.replace("_", " ")}'))

    db.commit()
    db.refresh(project)
    return _project_to_response(project, _counts_by_project(db, [project.id]).get(project.id, (0, 0)))


def delete_project(db: Session, project_id: int, actor: User | None = None) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise LookupError("Project not found")

    name = project.name
    # ponytail: FKs are enforced on Postgres; detach history before deleting parent
    task_ids = [row[0] for row in db.query(Task.id).filter(Task.project_id == project_id).all()]
    if task_ids:
        db.query(Activity).filter(Activity.task_id.in_(task_ids)).update({Activity.task_id: None}, synchronize_session=False)
    db.query(Activity).filter(Activity.project_id == project_id).update({Activity.project_id: None}, synchronize_session=False)
    db.delete(project)
    db.flush()
    db.add(Activity(actor_id=actor.id if actor else None, project_id=None, verb="deleted", detail=f'deleted project "{name}"'))
    db.commit()
