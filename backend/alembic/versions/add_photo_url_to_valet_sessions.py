"""add photo_url to valet_sessions

Revision ID: add_photo_url
Revises: remove_location_id
Create Date: 2024-02-12
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_photo_url'
down_revision = 'remove_location_id'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.add_column(sa.Column('photo_url', sa.String(255), nullable=True))

def downgrade():
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.drop_column('photo_url') 