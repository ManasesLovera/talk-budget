from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.wallet import WalletType


class WalletBase(BaseModel):
    name: str
    type: WalletType = WalletType.cash
    currency: str = "USD"
    category_id: int | None = None


class WalletCreate(WalletBase):
    balance: Decimal = Decimal("0")


class WalletUpdate(BaseModel):
    name: str | None = None
    balance: Decimal | None = None
    category_id: int | None = None


class WalletRead(WalletBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    balance: Decimal
    owner_id: int
