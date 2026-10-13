import random
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import SUPABASE_MANAGED_PASSWORD_PLACEHOLDER
from config import SUPABASE_SECRET_KEY, SUPABASE_URL
from models import AVATAR_COLORS, Activity, Notification, Task, TaskComment, User
from schemas import UserCreate, UserUpdate


def _extract_supabase_error_message(response_bytes: bytes) -> str:
    try:
        payload = json.loads(response_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return "Supabase request failed"

    if not isinstance(payload, dict):
        return "Supabase request failed"

    return (
        payload.get("msg")
        or payload.get("error_description")
        or payload.get("error")
        or "Supabase request failed"
    )


def _supabase_admin_request(method: str, path: str, payload: dict | None = None) -> dict:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        f"{SUPABASE_URL}{path}",
        data=body,
        method=method,
        headers={
            "apikey": SUPABASE_SECRET_KEY,
            "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read()
            if not response_body:
                return {}
            return json.loads(response_body.decode("utf-8"))
    except HTTPError as exc:
        detail = _extract_supabase_error_message(exc.read())
        raise ValueError(detail) from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ValueError("Unable to reach Supabase auth service") from exc


def _extract_supabase_user_id(payload: dict) -> str | None:
    direct_id = payload.get("id")
    if isinstance(direct_id, str) and direct_id.strip():
        return direct_id.strip()

    nested_user = payload.get("user")
    if isinstance(nested_user, dict):
        nested_id = nested_user.get("id")
        if isinstance(nested_id, str) and nested_id.strip():
            return nested_id.strip()

    return None


def _create_supabase_user(data: UserCreate) -> str:
    payload: dict = {
        "email": data.email,
        "password": data.password,
        "email_confirm": True,
        "user_metadata": {
            "name": data.name,
            "role": data.role,
            "must_change_password": True,
        },
    }

    response_payload = _supabase_admin_request("POST", "/auth/v1/admin/users", payload)
    supabase_user_id = _extract_supabase_user_id(response_payload)
    if not supabase_user_id:
        raise ValueError("Supabase user creation succeeded but no user id was returned")
    return supabase_user_id


def _delete_supabase_user(supabase_user_id: str) -> None:
    encoded_user_id = quote(supabase_user_id, safe="")
    try:
        _supabase_admin_request("DELETE", f"/auth/v1/admin/users/{encoded_user_id}")
    except ValueError as exc:
        # ponytail: a prior attempt may have removed the auth user before the
        # local commit failed; a missing remote user must not block local cleanup
        if "not found" not in str(exc).lower():
            raise


def _commit_with_integrity_handling(db: Session, error_message: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        lower_message = str(exc).lower()
        if "email" in lower_message and "unique" in lower_message:
            raise ValueError("Email already in use") from exc
        raise ValueError(error_message) from exc


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise LookupError("User not found")
    return user


def create_user(db: Session, data: UserCreate) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ValueError("Email already in use")

    if not data.password or len(data.password.strip()) < 8:
        raise ValueError("Password must be at least 8 characters")

    supabase_user_id = _create_supabase_user(data)

    user = User(
        supabase_user_id=supabase_user_id,
        name=data.name,
        email=data.email,
        hashed_password=SUPABASE_MANAGED_PASSWORD_PLACEHOLDER,
        role=data.role,
        must_change_password=True,
        avatar_color=data.avatar_color or random.choice(AVATAR_COLORS),
    )
    db.add(user)
    _commit_with_integrity_handling(db, "Failed to create user")
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    user = get_user(db, user_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    _commit_with_integrity_handling(db, "Failed to update user")
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    # ponytail: PG enforces FKs; detach/null history before deleting the user
    db.query(Task).filter(Task.assignee_id == user_id).update({Task.assignee_id: None}, synchronize_session=False)
    db.query(Activity).filter(Activity.actor_id == user_id).update({Activity.actor_id: None}, synchronize_session=False)
    db.query(Notification).filter(Notification.actor_id == user_id).update({Notification.actor_id: None}, synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
    db.query(TaskComment).filter(TaskComment.author_id == user_id).delete(synchronize_session=False)
    if user.supabase_user_id:
        _delete_supabase_user(user.supabase_user_id)
    db.delete(user)
    _commit_with_integrity_handling(db, "Failed to delete user")
