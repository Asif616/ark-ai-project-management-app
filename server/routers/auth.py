from urllib.parse import quote

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import UserResponse
from services.users_service import _supabase_admin_request

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/password-changed", response_model=UserResponse)
def password_changed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.must_change_password = False
    if current_user.supabase_user_id:
        # Best-effort remote sync: the local flag is the source of truth, so a
        # Supabase hiccup must never fail this request (or the user loop on reset).
        encoded_user_id = quote(current_user.supabase_user_id, safe="")
        try:
            remote = _supabase_admin_request("GET", f"/auth/v1/admin/users/{encoded_user_id}")
            metadata = remote.get("user_metadata")
            if not isinstance(metadata, dict):
                metadata = {}
            metadata["must_change_password"] = False
            _supabase_admin_request(
                "PUT",
                f"/auth/v1/admin/users/{encoded_user_id}",
                {"user_metadata": metadata},
            )
        except ValueError:
            pass
    db.commit()
    db.refresh(current_user)
    return current_user
