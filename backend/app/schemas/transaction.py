from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    description: str | None = None
    wallet_id: int
    to_wallet_id: int | None = None
    category_id: int | None = None
    occurred_at: datetime | None = None

    @model_validator(mode="after")
    def _validate_transfer_fields(self) -> "TransactionBase":
        if self.type == TransactionType.transfer:
            if self.to_wallet_id is None:
                raise ValueError("to_wallet_id is required for transfer transactions")
            if self.to_wallet_id == self.wallet_id:
                raise ValueError("to_wallet_id must differ from wallet_id")
        elif self.to_wallet_id is not None:
            raise ValueError("to_wallet_id is only valid for transfer transactions")
        return self


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    type: TransactionType
    description: str | None
    wallet_id: int
    to_wallet_id: int | None
    category_id: int | None
    owner_id: int
    occurred_at: datetime


class TransactionListResponse(BaseModel):
    items: list[TransactionRead]
    total: int
    total_income: Decimal
    total_expense: Decimal
