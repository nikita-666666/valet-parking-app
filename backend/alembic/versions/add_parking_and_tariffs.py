"""add_parking_and_tariffs

Revision ID: add_parking_and_tariffs
Revises: 3bdc3dc2a5d2
Create Date: 2024-02-12
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_parking_and_tariffs'
down_revision = '3bdc3dc2a5d2'  # Указываем ID предыдущей миграции
branch_labels = None
depends_on = None

def upgrade():
    # Создаем таблицу parkings
    op.create_table(
        'parkings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('address', sa.String(255), nullable=False),
        sa.Column('parking_type', sa.String(50)),
        sa.Column('floor_count', sa.Integer()),
        sa.Column('total_spaces', sa.Integer()),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаем таблицу parking_tariffs
    op.create_table(
        'parking_tariffs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('price_per_hour', sa.Float(), nullable=False),
        sa.Column('minimum_hours', sa.Integer(), default=1),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('parking_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['parking_id'], ['parkings.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Добавляем новые колонки в valet_sessions
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.add_column(sa.Column('parking_id', sa.Integer()))
        batch_op.add_column(sa.Column('tariff_id', sa.Integer()))
        batch_op.create_foreign_key('fk_valet_parking', 'parkings', ['parking_id'], ['id'])
        batch_op.create_foreign_key('fk_valet_tariff', 'parking_tariffs', ['tariff_id'], ['id'])

def downgrade():
    # Удаляем внешние ключи и колонки из valet_sessions
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.drop_constraint('fk_valet_tariff', type_='foreignkey')
        batch_op.drop_constraint('fk_valet_parking', type_='foreignkey')
        batch_op.drop_column('tariff_id')
        batch_op.drop_column('parking_id')
    
    # Удаляем таблицы
    op.drop_table('parking_tariffs')
    op.drop_table('parkings') 