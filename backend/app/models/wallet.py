import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WalletType(str, enum.Enum):
    cash = "cash"
    checking = "checking"
    savings = "savings"
    credit_card = "credit_card"
    investment = "investment"
    loan = "loan"


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[WalletType] = mapped_column(
        Enum(WalletType, name="wallet_type"), default=WalletType.cash, nullable=False
    )
    balance: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship(back_populates="wallets")  # noqa: F821
    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        back_populates="wallet", cascade="all, delete-orphan"
    )
