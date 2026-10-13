"""users_service pure helpers + CRUD with Supabase mocked out."""

import pytest

from schemas import UserCreate, UserUpdate
from services import users_service


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (b'{"msg": "taken"}', "taken"),
        (b'{"error_description": "bad"}', "bad"),
        (b'{"error": "nope"}', "nope"),
        (b"not-json{{{", "Supabase request failed"),
        (b"[1, 2]", "Supabase request failed"),
        (b"{}", "Supabase request failed"),
    ],
)
def test_extract_error_message(raw, expected):
    assert users_service._extract_supabase_error_message(raw) == expected


@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        ({"id": "abc"}, "abc"),
        ({"id": "  abc  "}, "abc"),
        ({"user": {"id": "nested"}}, "nested"),
        ({"id": ""}, None),
        ({"id": None}, None),
        ({}, None),
    ],
)
def test_extract_user_id(payload, expected):
    assert users_service._extract_supabase_user_id(payload) == expected


def test_create_user_mocks_supabase(db, monkeypatch):
    monkeypatch.setattr(
        users_service, "_create_supabase_user", lambda data: "sb-123"
    )
    created = users_service.create_user(
        db, UserCreate(name="Ann", email="ann@x.com", password="secret123")
    )
    assert created.supabase_user_id == "sb-123"
    assert created.must_change_password is True
    assert created.hashed_password == "SUPABASE_MANAGED"


def test_create_duplicate_email(db, monkeypatch):
    monkeypatch.setattr(users_service, "_create_supabase_user", lambda data: "sb-1")
    data = UserCreate(name="Ann", email="ann@x.com", password="secret123")
    users_service.create_user(db, data)
    with pytest.raises(ValueError, match="Email already in use"):
        users_service.create_user(db, data)


def test_create_short_password(db):
    with pytest.raises(ValueError, match="at least 8 characters"):
        users_service.create_user(
            db, UserCreate(name="Ann", email="ann@x.com", password="short")
        )


def test_get_missing_raises(db):
    with pytest.raises(LookupError, match="User not found"):
        users_service.get_user(db, 9999)


def test_update_and_delete(db, user, monkeypatch):
    updated = users_service.update_user(db, user.id, UserUpdate(name="New Name"))
    assert updated.name == "New Name"
    monkeypatch.setattr(users_service, "_delete_supabase_user", lambda uid: None)
    users_service.delete_user(db, user.id)
    with pytest.raises(LookupError, match="User not found"):
        users_service.get_user(db, user.id)


def test_delete_skips_supabase_when_unlinked(db, monkeypatch):
    from models import User

    row = User(name="Local", email="local@x.com", hashed_password="x", supabase_user_id=None)
    db.add(row)
    db.commit()
    called = []
    monkeypatch.setattr(
        users_service, "_delete_supabase_user", lambda uid: called.append(uid)
    )
    users_service.delete_user(db, row.id)
    assert called == []


def test_supabase_user_id_missing_raises(db, monkeypatch):
    monkeypatch.setattr(users_service, "_supabase_admin_request", lambda *a, **k: {})
    with pytest.raises(ValueError, match="no user id was returned"):
        users_service._create_supabase_user(
            UserCreate(name="A", email="a@x.com", password="secret123")
        )
