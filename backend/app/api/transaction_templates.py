from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.transaction_template import TransactionTemplate
from app.models.user import User
from app.schemas.transaction_template import (
    TransactionTemplateCreate,
    TransactionTemplateRead,
    TransactionTemplateUpdate,
)

router = APIRouter(prefix="/transaction-templates", tags=["transaction-templates"])


@router.get("", response_model=list[TransactionTemplateRead])
def list_transaction_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionTemplate]:
    return (
        db.query(TransactionTemplate)
        .filter(TransactionTemplate.owner_id == current_user.id)
        .order_by(TransactionTemplate.name)
        .all()
    )


@router.post("", response_model=TransactionTemplateRead, status_code=status.HTTP_201_CREATED)
def create_transaction_template(
    payload: TransactionTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionTemplate:
    template = TransactionTemplate(**payload.model_dump(), owner_id=current_user.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def _get_owned_template(
    db: Session, template_id: int, current_user: User
) -> TransactionTemplate:
    template = (
        db.query(TransactionTemplate)
        .filter(
            TransactionTemplate.id == template_id,
            TransactionTemplate.owner_id == current_user.id,
        )
        .first()
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction template not found",
        )
    return template


@router.patch("/{template_id}", response_model=TransactionTemplateRead)
def update_transaction_template(
    template_id: int,
    payload: TransactionTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionTemplate:
    template = _get_owned_template(db, template_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    template = _get_owned_template(db, template_id, current_user)
    db.delete(template)
    db.commit()
