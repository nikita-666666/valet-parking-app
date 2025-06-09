"""update parking location nullable

Revision ID: update_parking_location
Revises: add_parking_and_tariffs
Create Date: 2024-02-12
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_parking_location'
down_revision = 'add_parking_and_tariffs'
branch_labels = None
depends_on = None

def upgrade():
    # Изменяем колонку location_id на nullable
    with op.batch_alter_table('parkings') as batch_op:
        batch_op.alter_column('location_id',
                            existing_type=sa.Integer(),
                            nullable=True)

def downgrade():
    # Возвращаем not nullable
    with op.batch_alter_table('parkings') as batch_op:
        batch_op.alter_column('location_id',
                            existing_type=sa.Integer(),
                            nullable=False) 