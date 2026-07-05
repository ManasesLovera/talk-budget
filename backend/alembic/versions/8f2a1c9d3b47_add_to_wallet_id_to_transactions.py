"""add to_wallet_id to transactions

Revision ID: 8f2a1c9d3b47
Revises: 625bda644c62
Create Date: 2026-07-05 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f2a1c9d3b47"
down_revision: Union[str, None] = "625bda644c62"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("to_wallet_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "transactions_to_wallet_id_fkey",
        "transactions",
        "wallets",
        ["to_wallet_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("transactions_to_wallet_id_fkey", "transactions", type_="foreignkey")
    op.drop_column("transactions", "to_wallet_id")
