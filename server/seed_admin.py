import logging
import secrets

from sqlalchemy.exc import IntegrityError

from config import ADMIN_EMAIL, ADMIN_PASSWORD
from database import SessionLocal
from models import User
from services.users_service import _extract_supabase_user_id, _supabase_admin_request

logger = logging.getLogger("ark.seed_admin")


def _ensure_supabase_user(email: str, password: str) -> str | None:
    try:
        payload = _supabase_admin_request(
            "POST",
            "/auth/v1/admin/users",
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"must_change_password": True},
            },
        )
    except ValueError as exc:
        if "already" in str(exc).lower() or "exists" in str(exc).lower():
            logger.info("Supabase user %s already exists - keeping existing password", email)
            return None
        raise
    return _extract_supabase_user_id(payload)


# ponytail: skips entirely when unset or an admin already exists; restart-safe by design
def seed_admin() -> None:
    if not ADMIN_EMAIL:
        return

    db = SessionLocal()
    try:
        if db.query(User.id).filter(User.role == "admin").first():
            logger.info("Admin account already exists - skipping seed")
            return

        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if ADMIN_PASSWORD:
            if len(ADMIN_PASSWORD.strip()) < 8:
                raise RuntimeError("ADMIN_PASSWORD must be at least 8 characters")
            password = ADMIN_PASSWORD
        else:
            password = secrets.token_urlsafe(18)
            logger.warning("ADMIN_PASSWORD not set - generated temporary admin password: %s", password)
        supabase_user_id = _ensure_supabase_user(ADMIN_EMAIL, password)

        if existing is None:
            existing = User(
                name=ADMIN_EMAIL.split("@", 1)[0].replace(".", " ").replace("_", " ").title() or "Admin",
                email=ADMIN_EMAIL,
                hashed_password="SUPABASE_MANAGED",
                role="admin",
            )
        else:
            existing.role = "admin"
        if supabase_user_id:
            existing.supabase_user_id = supabase_user_id
        existing.must_change_password = True
        db.add(existing)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            logger.info("Admin account already exists - skipping seed")
            return
        logger.info("Seeded admin account for %s", ADMIN_EMAIL)
    finally:
        db.close()
