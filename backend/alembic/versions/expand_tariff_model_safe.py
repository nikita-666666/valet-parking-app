"""expand tariff model safe

Revision ID: expand_tariff_model_safe
Revises: add_parking_card_subscription
Create Date: 2024-01-20 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import reflection

# revision identifiers, used by Alembic.
revision = 'expand_tariff_model_safe'
down_revision = 'add_parking_card_subscription'
branch_labels = None
depends_on = None

def column_exists(table_name, column_name):
    """Проверяет, существует ли колонка в таблице"""
    conn = op.get_bind()
    inspector = reflection.Inspector.from_engine(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def upgrade():
    # Добавляем новые поля к таблице parking_tariffs только если их еще нет
    
    if not column_exists('parking_tariffs', 'description'):
        op.add_column('parking_tariffs', sa.Column('description', sa.Text(), nullable=True))
    
    if not column_exists('parking_tariffs', 'tariff_type'):
        op.add_column('parking_tariffs', sa.Column('tariff_type', sa.String(20), nullable=False, server_default='hourly'))
    
    if not column_exists('parking_tariffs', 'price_per_day'):
        op.add_column('parking_tariffs', sa.Column('price_per_day', sa.Float(), nullable=True, server_default='0.0'))
    
    if not column_exists('parking_tariffs', 'maximum_hours'):
        op.add_column('parking_tariffs', sa.Column('maximum_hours', sa.Integer(), nullable=True))
    
    if not column_exists('parking_tariffs', 'free_minutes'):
        op.add_column('parking_tariffs', sa.Column('free_minutes', sa.Integer(), nullable=False, server_default='0'))
    
    if not column_exists('parking_tariffs', 'is_default_for_residents'):
        op.add_column('parking_tariffs', sa.Column('is_default_for_residents', sa.Boolean(), nullable=False, server_default='0'))
    
    if not column_exists('parking_tariffs', 'is_default_for_guests'):
        op.add_column('parking_tariffs', sa.Column('is_default_for_guests', sa.Boolean(), nullable=False, server_default='0'))
    
    # Изменяем price_per_hour на nullable с дефолтным значением (если нужно)
    try:
        op.alter_column('parking_tariffs', 'price_per_hour', server_default='0.0')
    except Exception:
        pass  # Игнорируем если уже есть дефолтное значение
    
    # Создаем индексы для производительности (только если их еще нет)
    try:
        op.create_index('idx_parking_tariffs_type_active', 'parking_tariffs', ['tariff_type', 'is_active'])
    except Exception:
        pass  # Индекс уже существует
    
    try:
        op.create_index('idx_parking_tariffs_default_residents', 'parking_tariffs', ['parking_id', 'is_default_for_residents'])
    except Exception:
        pass  # Индекс уже существует
    
    try:
        op.create_index('idx_parking_tariffs_default_guests', 'parking_tariffs', ['parking_id', 'is_default_for_guests'])
    except Exception:
        pass  # Индекс уже существует

def downgrade():
    # Удаляем индексы (игнорируем ошибки если их нет)
    try:
        op.drop_index('idx_parking_tariffs_default_guests', 'parking_tariffs')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_parking_tariffs_default_residents', 'parking_tariffs')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_parking_tariffs_type_active', 'parking_tariffs')
    except Exception:
        pass
    
    # Удаляем добавленные колонки (игнорируем ошибки если их нет)
    try:
        op.drop_column('parking_tariffs', 'is_default_for_guests')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'is_default_for_residents')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'free_minutes')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'maximum_hours')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'price_per_day')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'tariff_type')
    except Exception:
        pass
    
    try:
        op.drop_column('parking_tariffs', 'description')
    except Exception:
        pass 