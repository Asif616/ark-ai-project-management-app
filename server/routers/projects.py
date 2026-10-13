from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import User
from schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from services import projects_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return projects_service.list_projects(db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return projects_service.get_project(db, project_id)


@router.post("/", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return projects_service.create_project(db, data, actor=current_user)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return projects_service.update_project(db, project_id, data, actor=admin)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    projects_service.delete_project(db, project_id, actor=admin)
    return {"detail": "Project deleted"}
