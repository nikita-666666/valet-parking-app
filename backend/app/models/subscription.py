from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum

class SubscriptionStatus(enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"

class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey('subscription_templates.id'))
    client_name = Column(String(255))
    client_surname = Column(String(255))
    client_phone = Column(String(20))
    client_build = Column(Integer)
    client_appartament = Column(String(10))
    client_card_number = Column(String(20), nullable=False)
    car_number = Column(String(20))
    car_model = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    visits_used = Column(Integer, default=0)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.active)
    location_id = Column(Integer, ForeignKey('locations.id'))

    subscription_template = relationship("SubscriptionTemplate", back_populates="subscriptions")
    location = relationship("Location")