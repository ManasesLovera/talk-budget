from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    description: str | None = None
    wallet_id: int
    category_id: int | None = None
    occurred_at: datetime | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    type: TransactionType
    description: str | None
    wallet_id: int
    category_id: int | None
    owner_id: int
    occurred_at: datetime
