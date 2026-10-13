import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    stripped = value.strip() if value else ""
    if not stripped:
        if default is None:
            raise RuntimeError(f"Missing required environment variable: {name}")
        return default
    return stripped


DATABASE_URL = _env("DATABASE_URL")

SUPABASE_URL = _env("SUPABASE_URL").rstrip("/")
SUPABASE_SECRET_KEY = _env("SUPABASE_SECRET_KEY")
SUPABASE_JWT_ISSUER = _env("SUPABASE_JWT_ISSUER", f"{SUPABASE_URL}/auth/v1")
SUPABASE_JWKS_URL = _env("SUPABASE_JWKS_URL", f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
SUPABASE_JWT_AUDIENCE = _env("SUPABASE_JWT_AUDIENCE", "authenticated")

BACKEND_CORS_ORIGINS = [item.strip() for item in _env("BACKEND_CORS_ORIGINS").split(",") if item.strip()]
if not BACKEND_CORS_ORIGINS:
    raise RuntimeError("BACKEND_CORS_ORIGINS must contain at least one origin")

ADMIN_EMAIL = _env("ADMIN_EMAIL", "")
ADMIN_PASSWORD = _env("ADMIN_PASSWORD", "")
