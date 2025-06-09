"""replace_photos_json_with_urls

Revision ID: be0f09a53041
Revises: ec2a66cb0c7b
Create Date: 2025-06-06 12:23:26.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be0f09a53041'
down_revision: Union[str, None] = 'ec2a66cb0c7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Удаляем тяжелые JSON поля фотографий
    op.drop_column('valet_sessions', 'photos')
    op.drop_column('valet_sessions', 'parking_photos')
    op.drop_column('valet_sessions', 'return_start_photos')
    op.drop_column('valet_sessions', 'return_delivery_photos')
    
    # Добавляем простые строковые поля для URL-ов фотографий (разделенные запятыми)
    op.add_column('valet_sessions', sa.Column('car_photos_urls', sa.Text, nullable=True))
    op.add_column('valet_sessions', sa.Column('parking_photos_urls', sa.Text, nullable=True))
    op.add_column('valet_sessions', sa.Column('return_start_photos_urls', sa.Text, nullable=True))
    op.add_column('valet_sessions', sa.Column('return_delivery_photos_urls', sa.Text, nullable=True))


def downgrade() -> None:
    # Удаляем новые поля
    op.drop_column('valet_sessions', 'return_delivery_photos_urls')
    op.drop_column('valet_sessions', 'return_start_photos_urls')
    op.drop_column('valet_sessions', 'parking_photos_urls')
    op.drop_column('valet_sessions', 'car_photos_urls')
    
    # Возвращаем JSON поля (пустые)
    op.add_column('valet_sessions', sa.Column('photos', sa.JSON, nullable=True))
    op.add_column('valet_sessions', sa.Column('parking_photos', sa.JSON, nullable=True))
    op.add_column('valet_sessions', sa.Column('return_start_photos', sa.JSON, nullable=True))
    op.add_column('valet_sessions', sa.Column('return_delivery_photos', sa.JSON, nullable=True))
