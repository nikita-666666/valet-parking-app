from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class ParkingTariffBase(BaseModel):
    name: str
    price_per_hour: float
    minimum_hours: Optional[int] = 1
    is_active: Optional[bool] = True

class ParkingTariffCreate(ParkingTariffBase):
    parking_id: int

class ParkingTariffUpdate(ParkingTariffBase):
    pass

class ParkingTariff(ParkingTariffBase):
    id: int
    parking_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParkingBase(BaseModel):
    name: str
    address: str
    parking_type: Optional[str] = None
    floor_count: Optional[int] = None
    total_spaces: Optional[int] = None
    location_id: int

class ParkingCreate(ParkingBase):
    pass

class ParkingUpdate(ParkingBase):
    pass

class Parking(ParkingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    tariffs: List[ParkingTariff] = []

    class Config:
        from_attributes = True 