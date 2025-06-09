from sqlalchemy import Column, Integer, String, Text, Enum, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum

class OnlinePayment(enum.Enum):
    yes = "yes"
    no = "no"

class TemplateStatus(enum.Enum):
    active = "active"
    inactive = "inactive"

class SubscriptionTemplate(Base, TimestampMixin):
    __tablename__ = "subscription_templates"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey('locations.id'))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sale_conditions = Column(Text)
    online_payment = Column(Enum(OnlinePayment))
    min_duration_months = Column(Integer)
    max_duration_months = Column(Integer)
    price_per_month = Column(DECIMAL(10, 2))
    status = Column(Enum(TemplateStatus))

    # Relationships
    subscriptions = relationship("Subscription", back_populates="subscription_template")
    location = relationship("Location")