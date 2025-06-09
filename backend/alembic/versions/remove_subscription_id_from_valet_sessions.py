"""remove subscription_id from valet_sessions

Revision ID: remove_subscription_id
Revises: add_photo_url
Create Date: 2024-02-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'remove_subscription_id'
down_revision = 'add_photo_url'
branch_labels = None
depends_on = None

def upgrade():
    # Получаем соединение
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # Получаем список foreign keys
    fks = inspector.get_foreign_keys('valet_sessions')
    
    with op.batch_alter_table('valet_sessions') as batch_op:
        # Удаляем foreign key только если он существует
        for fk in fks:
            if 'subscription_id' in fk['constrained_columns']:
                batch_op.drop_constraint(fk['name'], type_='foreignkey')
        
        # Удаляем колонку
        batch_op.drop_column('subscription_id')

def downgrade():
    with op.batch_alter_table('valet_sessions') as batch_op:
        batch_op.add_column(sa.Column('subscription_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'valet_sessions_subscriptions_fk',
            'subscriptions',
            ['subscription_id'],
            ['id']
        ) 