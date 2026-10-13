"""notifications_service list / read / read-all."""

import pytest

from models import Notification
from services import notifications_service


def _notify(db, user, message="hello", read=False):
    row = Notification(user_id=user.id, message=message, link="/p/1", is_read=read)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def test_list_newest_first_and_limit(db, user):
    first = _notify(db, user, "first")
    _notify(db, user, "second")
    for i in range(35):
        _notify(db, user, f"bulk-{i}")
    rows = notifications_service.list_notifications(db, user.id)
    assert len(rows) == 30
    assert rows[0].message == "bulk-34"
    assert first.id not in [r.id for r in rows]


def test_list_is_scoped_to_user(db, user, admin):
    _notify(db, admin, "not yours")
    assert notifications_service.list_notifications(db, user.id) == []


def test_mark_read_and_wrong_user(db, user, admin):
    row = _notify(db, user)
    notifications_service.mark_read(db, user.id, row.id)
    assert notifications_service.list_notifications(db, user.id)[0].is_read is True
    with pytest.raises(LookupError, match="Notification not found"):
        notifications_service.mark_read(db, admin.id, row.id)
    with pytest.raises(LookupError, match="Notification not found"):
        notifications_service.mark_read(db, user.id, 9999)


def test_mark_all_read(db, user):
    _notify(db, user, "a")
    _notify(db, user, "b", read=True)
    notifications_service.mark_all_read(db, user.id)
    assert all(r.is_read for r in notifications_service.list_notifications(db, user.id))
