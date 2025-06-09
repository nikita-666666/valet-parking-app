from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class SubscriptionStatus(str, Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"

class SubscriptionBase(BaseModel):
    template_id: int
    client_name: str
    client_surname: Optional[str] = None
    client_phone: Optional[str] = None
    client_build: Optional[int] = None
    client_appartament: Optional[str] = None
    client_card_number: str
    car_number: str
    car_model: Optional[str] = None
    start_date: date
    end_date: date
    status: SubscriptionStatus = SubscriptionStatus.active
    location_id: int

class SubscriptionCreate(SubscriptionBase):
    client_surname: str
    pass

class SubscriptionUpdate(BaseModel):
    template_id: Optional[int] = None
    client_name: Optional[str] = None
    client_surname: Optional[str] = None
    client_phone: Optional[str] = None
    client_build: Optional[int] = None
    client_appartament: Optional[str] = None
    client_card_number: Optional[str] = None
    car_number: Optional[str] = None
    car_model: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    visits_used: Optional[int] = None
    status: Optional[SubscriptionStatus] = None
    location_id: Optional[int] = None

class Subscription(SubscriptionBase):
    id: int
    visits_used: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        } 