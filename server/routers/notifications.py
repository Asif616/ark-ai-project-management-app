from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import NotificationResponse
from services import notifications_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notifications_service.list_notifications(db, current_user.id)


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications_service.mark_read(db, current_user.id, notification_id)
    return {"detail": "Read"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications_service.mark_all_read(db, current_user.id)
    return {"detail": "All read"}
