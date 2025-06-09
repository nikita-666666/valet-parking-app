# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.employee import Employee
from app.models.role import Role
from app.models.subscription import Subscription
# ... импортируйте другие модели здесь
