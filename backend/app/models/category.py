from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    # Lucide icon name or SVG identifier used by the mobile UI.
    icon: Mapped[str] = mapped_column(String(64), default="circle", nullable=False)
    color: Mapped[str] = mapped_column(String(16), default="#0d9488", nullable=False)
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        back_populates="category"
    )
