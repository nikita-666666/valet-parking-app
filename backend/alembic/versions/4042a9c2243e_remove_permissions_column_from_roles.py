"""remove_permissions_column_from_roles

Revision ID: 4042a9c2243e
Revises: be0f09a53041
Create Date: 2025-06-06 13:53:47.527243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4042a9c2243e'
down_revision: Union[str, None] = 'be0f09a53041'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Удаляем поле permissions из таблицы roles
    with op.batch_alter_table('roles', schema=None) as batch_op:
        batch_op.drop_column('permissions')


def downgrade() -> None:
    # Восстанавливаем поле permissions в таблице roles
    with op.batch_alter_table('roles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('permissions', sa.JSON(), nullable=False))
