from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import User
from schemas import UserCreate, UserResponse, UserUpdate
from services import users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return users_service.list_users(db)


@router.post("/", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return users_service.create_user(db, data)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return users_service.update_user(db, user_id, data)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users_service.delete_user(db, user_id)
    return {"detail": "User deleted"}
