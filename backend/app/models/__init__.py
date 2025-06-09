# Импортируем все модели для правильной инициализации SQLAlchemy
from .base import Base, TimestampMixin
from .role import Role, Permission
from .employee import Employee
from .user import User
from .location import Location
from .parking import Parking
from .parking_tariff import ParkingTariff
from .subscription_template import SubscriptionTemplate
from .subscription import Subscription
from .valet_session import ValetSession
from .photo import Photo

__all__ = [
    "Base",
    "TimestampMixin", 
    "Role",
    "Permission",
    "Employee",
    "User", 
    "Location",
    "Parking",
    "ParkingTariff",
    "SubscriptionTemplate",
    "Subscription", 
    "ValetSession",
    "Photo"
]
