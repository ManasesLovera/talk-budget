from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.transaction import TransactionType


class TransactionTemplateBase(BaseModel):
    name: str
    type: TransactionType
    amount: Decimal | None = None
    description: str | None = None
    wallet_id: int | None = None
    category_id: int | None = None


class TransactionTemplateCreate(TransactionTemplateBase):
    pass


class TransactionTemplateUpdate(BaseModel):
    name: str | None = None
    type: TransactionType | None = None
    amount: Decimal | None = None
    description: str | None = None
    wallet_id: int | None = None
    category_id: int | None = None


class TransactionTemplateRead(TransactionTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
