"""add parking_card and has_subscription fields

Revision ID: add_parking_card_subscription
Revises: ec2a66cb0c7b
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_parking_card_subscription'
down_revision = 'ec2a66cb0c7b'
branch_labels = None
depends_on = None

def upgrade():
    # Добавляем поле parking_card (номер парковочной карты)
    op.add_column('valet_sessions', sa.Column('parking_card', sa.String(length=50), nullable=True))
    
    # Добавляем поле has_subscription (наличие активного абонемента)
    op.add_column('valet_sessions', sa.Column('has_subscription', sa.Boolean(), nullable=True))
    
    # Устанавливаем значение по умолчанию для существующих записей
    op.execute("UPDATE valet_sessions SET has_subscription = FALSE WHERE has_subscription IS NULL")
    
    # Делаем поле has_subscription NOT NULL с дефолтным значением
    op.alter_column('valet_sessions', 'has_subscription', nullable=False, server_default=sa.text('FALSE'))
    
    # Создаем индексы для быстрого поиска
    op.create_index('idx_valet_sessions_parking_card', 'valet_sessions', ['parking_card'])
    op.create_index('idx_valet_sessions_has_subscription', 'valet_sessions', ['has_subscription'])
    op.create_index('idx_valet_sessions_subscription_status', 'valet_sessions', ['has_subscription', 'status'])

def downgrade():
    # Удаляем индексы
    op.drop_index('idx_valet_sessions_subscription_status', 'valet_sessions')
    op.drop_index('idx_valet_sessions_has_subscription', 'valet_sessions')
    op.drop_index('idx_valet_sessions_parking_card', 'valet_sessions')
    
    # Удаляем поля
    op.drop_column('valet_sessions', 'has_subscription')
    op.drop_column('valet_sessions', 'parking_card') 