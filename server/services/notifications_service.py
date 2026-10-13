from sqlalchemy.orm import Session

from models import Notification
from schemas import NotificationResponse


def list_notifications(db: Session, user_id: int) -> list[NotificationResponse]:
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        NotificationResponse(
            id=row.id,
            message=row.message,
            link=row.link,
            is_read=row.is_read,
            actor_name=row.actor.name if row.actor else None,
            created_at=row.created_at,
        )
        for row in rows
    ]


def mark_read(db: Session, user_id: int, notification_id: int) -> None:
    row = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not row:
        raise LookupError("Notification not found")
    row.is_read = True
    db.commit()


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).update(
        {"is_read": True}
    )
    db.commit()
