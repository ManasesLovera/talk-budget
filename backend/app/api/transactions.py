from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.transaction import TransactionCreate, TransactionRead

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _apply_balance(wallet: Wallet, amount, type_: TransactionType, sign: int) -> None:
    delta = amount if type_ == TransactionType.income else -amount
    wallet.balance = wallet.balance + (sign * delta)


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category_id: int | None = None,
    wallet_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    query = db.query(Transaction).filter(Transaction.owner_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.occurred_at >= start_date)
    if end_date:
        query = query.filter(Transaction.occurred_at <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if wallet_id:
        query = query.filter(Transaction.wallet_id == wallet_id)
    return query.order_by(Transaction.occurred_at.desc()).all()


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    wallet = (
        db.query(Wallet)
        .filter(Wallet.id == payload.wallet_id, Wallet.owner_id == current_user.id)
        .first()
    )
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")

    data = payload.model_dump()
    if data.get("occurred_at") is None:
        data.pop("occurred_at", None)

    transaction = Transaction(**data, owner_id=current_user.id)
    _apply_balance(wallet, payload.amount, payload.type, sign=1)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.owner_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    wallet = db.query(Wallet).filter(Wallet.id == transaction.wallet_id).first()
    if wallet:
        _apply_balance(wallet, transaction.amount, transaction.type, sign=-1)

    db.delete(transaction)
    db.commit()
