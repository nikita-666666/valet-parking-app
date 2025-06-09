"""add_indexes_for_performance

Revision ID: ec2a66cb0c7b
Revises: add_photos_fields
Create Date: 2025-06-06 12:12:08.257104

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec2a66cb0c7b'
down_revision: Union[str, None] = 'add_photos_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создаем индексы для оптимизации запросов к valet_sessions
    
    # Индекс на status для быстрой фильтрации
    op.create_index('idx_valet_sessions_status', 'valet_sessions', ['status'])
    
    # Индекс на client_card_number для быстрого поиска по карте
    op.create_index('idx_valet_sessions_card_number', 'valet_sessions', ['client_card_number'])
    
    # Составной индекс для поиска активных сессий по карте
    op.create_index('idx_valet_sessions_card_status', 'valet_sessions', ['client_card_number', 'status'])
    
    # Индекс на car_number для поиска по номеру авто
    op.create_index('idx_valet_sessions_car_number', 'valet_sessions', ['car_number'])
    
    # Индекс на employee_id для поиска сессий сотрудника
    op.create_index('idx_valet_sessions_employee', 'valet_sessions', ['employee_id'])


def downgrade() -> None:
    # Удаляем созданные индексы
    op.drop_index('idx_valet_sessions_employee', 'valet_sessions')
    op.drop_index('idx_valet_sessions_car_number', 'valet_sessions')
    op.drop_index('idx_valet_sessions_card_status', 'valet_sessions')
    op.drop_index('idx_valet_sessions_card_number', 'valet_sessions')
    op.drop_index('idx_valet_sessions_status', 'valet_sessions')
