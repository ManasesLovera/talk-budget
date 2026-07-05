"""add category_id to wallets

Revision ID: 625bda644c62
Revises:
Create Date: 2026-07-05 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "625bda644c62"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "wallets",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "wallets_category_id_fkey",
        "wallets",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("wallets_category_id_fkey", "wallets", type_="foreignkey")
    op.drop_column("wallets", "category_id")
