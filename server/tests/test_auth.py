"""auth.py token decode, provisioning, and admin guard — JWKS/DB faked."""

import pytest
from fastapi import HTTPException

import auth
from auth import require_admin


def _valid_header(monkeypatch, alg="RS256", kid="k1"):
    monkeypatch.setattr(
        auth.jwt, "get_unverified_header", lambda token: {"kid": kid, "alg": alg}
    )


def test_decode_ok(monkeypatch):
    _valid_header(monkeypatch)
    monkeypatch.setattr(auth, "_get_jwks", lambda force_refresh=False: {"keys": [{"kid": "k1"}]})
    monkeypatch.setattr(auth.jwt, "decode", lambda *a, **k: {"sub": "u1"})
    assert auth._decode_supabase_access_token("tok") == {"sub": "u1"}


def test_decode_rejects_alg(monkeypatch):
    _valid_header(monkeypatch, alg="HS256")
    with pytest.raises(HTTPException) as exc:
        auth._decode_supabase_access_token("tok")
    assert exc.value.status_code == 401


def test_decode_refreshes_jwks_on_unknown_kid(monkeypatch):
    _valid_header(monkeypatch)
    calls = []
    monkeypatch.setattr(
        auth,
        "_get_jwks",
        lambda force_refresh=False: (
            calls.append(force_refresh) or {"keys": [] if not force_refresh else [{"kid": "k1"}]}
        ),
    )
    monkeypatch.setattr(auth.jwt, "decode", lambda *a, **k: {"sub": "u1"})
    assert auth._decode_supabase_access_token("tok") == {"sub": "u1"}
    assert calls == [False, True]


def test_decode_unknown_kid_raises(monkeypatch):
    _valid_header(monkeypatch)
    monkeypatch.setattr(auth, "_get_jwks", lambda force_refresh=False: {"keys": []})
    with pytest.raises(HTTPException) as exc:
        auth._decode_supabase_access_token("tok")
    assert exc.value.status_code == 401


def test_get_current_user_by_subject(db, user, monkeypatch):
    user.supabase_user_id = "sb-1"
    db.commit()
    monkeypatch.setattr(
        auth, "_decode_supabase_access_token", lambda token: {"sub": "sb-1", "email": user.email}
    )
    assert auth.get_current_user(token="t", db=db).id == user.id


def test_get_current_user_links_by_email(db, user, monkeypatch):
    assert user.supabase_user_id is None
    monkeypatch.setattr(
        auth,
        "_decode_supabase_access_token",
        lambda token: {"sub": "sb-9", "email": user.email, "user_metadata": {"must_change_password": True}},
    )
    found = auth.get_current_user(token="t", db=db)
    assert found.supabase_user_id == "sb-9"
    assert found.must_change_password is True


def test_get_current_user_unprovisioned(db, monkeypatch):
    monkeypatch.setattr(
        auth, "_decode_supabase_access_token", lambda token: {"sub": "nope", "email": "ghost@x.com"}
    )
    with pytest.raises(HTTPException) as exc:
        auth.get_current_user(token="t", db=db)
    assert exc.value.status_code == 403


def test_get_current_user_missing_claims(db, monkeypatch):
    monkeypatch.setattr(
        auth, "_decode_supabase_access_token", lambda token: {"sub": "", "email": None}
    )
    with pytest.raises(HTTPException) as exc:
        auth.get_current_user(token="t", db=db)
    assert exc.value.status_code == 401


def test_require_admin_blocks_user(user):
    with pytest.raises(HTTPException) as exc:
        require_admin(current_user=user)
    assert exc.value.status_code == 403


def test_require_admin_passes(admin):
    assert require_admin(current_user=admin).id == admin.id


def test_jwks_caches(monkeypatch):
    monkeypatch.setattr(auth, "_fetch_jwks", lambda: {"keys": []})
    auth._jwks_cache.update({"expires_at": 0.0, "keys": None})
    auth._get_jwks()
    first = auth._jwks_cache["keys"]
    auth._get_jwks()  # cache hit: same object, no refetch
    assert auth._jwks_cache["keys"] is first
