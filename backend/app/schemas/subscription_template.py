from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class SubscriptionTemplateBase(BaseModel):
    location_id: int
    name: str
    description: Optional[str] = None
    sale_conditions: Optional[str] = None
    online_payment: str = "yes"
    min_duration_months: int
    max_duration_months: int
    price_per_month: Decimal
    status: str = "active"

class SubscriptionTemplateCreate(SubscriptionTemplateBase):
    pass

class SubscriptionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sale_conditions: Optional[str] = None
    online_payment: Optional[str] = None
    min_duration_months: Optional[int] = None
    max_duration_months: Optional[int] = None
    price_per_month: Optional[Decimal] = None
    status: Optional[str] = None

class SubscriptionTemplate(SubscriptionTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 