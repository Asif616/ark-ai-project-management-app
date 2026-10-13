import json
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from config import (
    SUPABASE_JWKS_URL,
    SUPABASE_JWT_AUDIENCE,
    SUPABASE_JWT_ISSUER,
)
from database import get_db
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')
SUPABASE_MANAGED_PASSWORD_PLACEHOLDER = "SUPABASE_MANAGED"

_JWKS_CACHE_SECONDS = 300
_jwks_cache: dict = {"expires_at": 0.0, "keys": None}


def _jwks_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Unable to verify authentication token",
    )


def _fetch_jwks() -> dict:
    request = Request(SUPABASE_JWKS_URL, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=6) as response:
            if response.status != 200:
                raise _jwks_unavailable()
            payload = response.read().decode("utf-8")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise _jwks_unavailable() from exc

    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise _jwks_unavailable() from exc
    if not isinstance(data, dict) or "keys" not in data:
        raise _jwks_unavailable()
    return data


def _get_jwks(force_refresh: bool = False) -> dict:
    now = time.monotonic()
    cache_expired = _jwks_cache["expires_at"] <= now
    if force_refresh or cache_expired or _jwks_cache["keys"] is None:
        _jwks_cache["keys"] = _fetch_jwks()
        _jwks_cache["expires_at"] = now + _JWKS_CACHE_SECONDS
    return _jwks_cache["keys"]


def _decode_supabase_access_token(token: str) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        unverified_header = jwt.get_unverified_header(token)
        key_id = unverified_header.get("kid")
        token_alg = unverified_header.get("alg")
    except JWTError as exc:
        raise credentials_exception from exc

    allowed_algs = {"ES256", "RS256"}
    if token_alg not in allowed_algs:
        raise credentials_exception

    jwks = _get_jwks(force_refresh=False)
    signing_key = next((key for key in jwks.get("keys", []) if key.get("kid") == key_id), None)
    if signing_key is None:
        jwks = _get_jwks(force_refresh=True)
        signing_key = next((key for key in jwks.get("keys", []) if key.get("kid") == key_id), None)
        if signing_key is None:
            raise credentials_exception

    try:
        return jwt.decode(
            token,
            key=signing_key,
            algorithms=[token_alg],
            issuer=SUPABASE_JWT_ISSUER,
            audience=SUPABASE_JWT_AUDIENCE,
            options={"verify_aud": bool(SUPABASE_JWT_AUDIENCE)},
        )
    except JWTError as exc:
        raise credentials_exception from exc


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = _decode_supabase_access_token(token)
    subject = payload.get("sub")
    email = payload.get("email")
    metadata = payload.get("user_metadata")

    if not subject or not isinstance(subject, str) or not email or not isinstance(email, str):
        raise credentials_exception

    user = db.query(User).filter(User.supabase_user_id == subject).first()

    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.supabase_user_id = subject
            if not user.hashed_password:
                user.hashed_password = SUPABASE_MANAGED_PASSWORD_PLACEHOLDER
            if isinstance(metadata, dict) and metadata.get("must_change_password") is True:
                user.must_change_password = True
            db.commit()
            db.refresh(user)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not provisioned. Contact your administrator.",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
