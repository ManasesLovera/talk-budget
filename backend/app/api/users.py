from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    """Admin-only: list all users (RBAC demonstration)."""
    return db.query(User).order_by(User.id).all()


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)

    for field in ("username", "email"):
        if field in data and data[field] is not None:
            exists = (
                db.query(User)
                .filter(getattr(User, field) == data[field], User.id != current_user.id)
                .first()
            )
            if exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} already in use",
                )
            setattr(current_user, field, data[field])

    if password:
        current_user.hashed_password = hash_password(password)

    db.commit()
    db.refresh(current_user)
    return current_user
