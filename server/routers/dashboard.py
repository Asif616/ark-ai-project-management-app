from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import ActivityResponse, DashboardStats
from services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_dashboard_stats(db)


@router.get("/activity", response_model=list[ActivityResponse])
def get_activity(
    project_id: Optional[int] = Query(None),
    limit: int = Query(12, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.list_activity(db, project_id=project_id, limit=limit)
