"""add photos to valet_sessions

Revision ID: add_photos_fields
Revises: add_photo_url
Create Date: 2024-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_photos_fields'
down_revision = 'remove_subscription_id'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('valet_sessions') as batch_op:
        # Добавляем JSON поля для фотографий
        batch_op.add_column(sa.Column('photos', sa.JSON, nullable=True))
        batch_op.add_column(sa.Column('parking_photos', sa.JSON, nullable=True))
        batch_op.add_column(sa.Column('return_start_photos', sa.JSON, nullable=True))
        batch_op.add_column(sa.Column('return_delivery_photos', sa.JSON, nullable=True))

def downgrade():
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.drop_column('photos')
        batch_op.drop_column('parking_photos')
        batch_op.drop_column('return_start_photos')
        batch_op.drop_column('return_delivery_photos') 