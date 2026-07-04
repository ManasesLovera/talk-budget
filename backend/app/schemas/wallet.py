from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.wallet import WalletType


class WalletBase(BaseModel):
    name: str
    type: WalletType = WalletType.cash
    currency: str = "USD"


class WalletCreate(WalletBase):
    balance: Decimal = Decimal("0")


class WalletRead(WalletBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    balance: Decimal
    owner_id: int
