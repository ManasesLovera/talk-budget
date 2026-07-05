from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.transaction import TransactionCreate, TransactionListResponse, TransactionRead

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _apply_balance(
    wallet: Wallet,
    amount,
    type_: TransactionType,
    sign: int,
    to_wallet: Wallet | None = None,
) -> None:
    if type_ == TransactionType.transfer:
        wallet.balance = wallet.balance - (sign * amount)
        if to_wallet is not None:
            to_wallet.balance = to_wallet.balance + (sign * amount)
        return
    delta = amount if type_ == TransactionType.income else -amount
    wallet.balance = wallet.balance + (sign * delta)


def _get_owned_wallet(db: Session, wallet_id: int, owner_id: int) -> Wallet:
    wallet = (
        db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.owner_id == owner_id).first()
    )
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
    return wallet


def _apply_filters(query, current_user, start_date, end_date, category_id, wallet_id, type_):
    query = query.filter(Transaction.owner_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.occurred_at >= start_date)
    if end_date:
        query = query.filter(Transaction.occurred_at <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if wallet_id:
        query = query.filter(Transaction.wallet_id == wallet_id)
    if type_:
        query = query.filter(Transaction.type == type_)
    return query


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category_id: int | None = None,
    wallet_id: int | None = None,
    type: TransactionType | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionListResponse:
    base_query = _apply_filters(
        db.query(Transaction), current_user, start_date, end_date, category_id, wallet_id, type
    )

    total = base_query.count()

    totals_row = (
        _apply_filters(
            db.query(
                func.coalesce(
                    func.sum(Transaction.amount).filter(Transaction.type == TransactionType.income),
                    0,
                ),
                func.coalesce(
                    func.sum(Transaction.amount).filter(Transaction.type == TransactionType.expense),
                    0,
                ),
            ),
            current_user,
            start_date,
            end_date,
            category_id,
            wallet_id,
            type,
        )
    ).one()
    total_income, total_expense = totals_row

    items = (
        base_query.order_by(Transaction.occurred_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TransactionListResponse(
        items=items,
        total=total,
        total_income=Decimal(total_income),
        total_expense=Decimal(total_expense),
    )


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    wallet = _get_owned_wallet(db, payload.wallet_id, current_user.id)
    to_wallet = None
    if payload.type == TransactionType.transfer:
        to_wallet = _get_owned_wallet(db, payload.to_wallet_id, current_user.id)

    data = payload.model_dump()
    if data.get("occurred_at") is None:
        data.pop("occurred_at", None)

    transaction = Transaction(**data, owner_id=current_user.id)
    _apply_balance(wallet, payload.amount, payload.type, sign=1, to_wallet=to_wallet)

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
    to_wallet = None
    if transaction.to_wallet_id is not None:
        to_wallet = db.query(Wallet).filter(Wallet.id == transaction.to_wallet_id).first()
    if wallet:
        _apply_balance(wallet, transaction.amount, transaction.type, sign=-1, to_wallet=to_wallet)

    db.delete(transaction)
    db.commit()
