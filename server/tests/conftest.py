"""Shared pytest fixtures. Dummy env + temp sqlite so tests never touch real secrets."""

import os
import sys
import tempfile

# Best practice: fake every secret BEFORE importing app modules.
# config.py raises at import time, so these must come first.
_TMPDIR = tempfile.mkdtemp(prefix="ark-test-")
os.environ.setdefault("SECRET_KEY", "dummy-ci-key")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TMPDIR}/test.db")
os.environ.setdefault("SUPABASE_URL", "https://dummy.supabase.co")
os.environ.setdefault("SUPABASE_SECRET_KEY", "dummy-key")
os.environ.setdefault("BACKEND_CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ADMIN_EMAIL", "")
os.environ.setdefault("ADMIN_PASSWORD", "")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest  # noqa: E402

from database import Base, SessionLocal, engine  # noqa: E402

import models  # noqa: E402,F401  (register tables)


@pytest.fixture()
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def user(db):
    from models import User

    row = User(name="Test User", email="test@example.com", hashed_password="x", role="user")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@pytest.fixture()
def admin(db):
    from models import User

    row = User(name="Admin", email="admin@example.com", hashed_password="x", role="admin")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@pytest.fixture()
def project(db):
    from models import Project

    row = Project(name="Website", description="", status="active")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
