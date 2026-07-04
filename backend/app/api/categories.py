from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Category]:
    """Global categories (owner_id is null) plus the user's own."""
    return (
        db.query(Category)
        .filter(or_(Category.owner_id.is_(None), Category.owner_id == current_user.id))
        .order_by(Category.name)
        .all()
    )


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    category = Category(**payload.model_dump(), owner_id=current_user.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def _get_owned_category(db: Session, category_id: int, current_user: User) -> Category:
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.owner_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    category = _get_owned_category(db, category_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    category = _get_owned_category(db, category_id, current_user)
    db.delete(category)
    db.commit()
