from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ParkingTariffBase(BaseModel):
    name: str = Field(..., description="Название тарифа")
    description: Optional[str] = Field(None, description="Подробное описание тарифа")
    tariff_type: str = Field('hourly', description="Тип тарифа: hourly, daily, free, vip")
    price_per_hour: float = Field(0.0, description="Цена за час в рублях")
    price_per_day: Optional[float] = Field(0.0, description="Цена за день в рублях")
    minimum_hours: int = Field(1, description="Минимальное количество часов")
    maximum_hours: Optional[int] = Field(None, description="Максимальное количество часов")
    free_minutes: int = Field(0, description="Бесплатные минуты (грейс-период)")
    is_active: bool = Field(True, description="Активен ли тариф")
    is_default_for_residents: bool = Field(False, description="Тариф по умолчанию для резидентов")
    is_default_for_guests: bool = Field(False, description="Тариф по умолчанию для гостей")

class ParkingTariffCreate(ParkingTariffBase):
    # parking_id: int = Field(..., description="ID парковки") # Временно убрано
    pass

class ParkingTariffUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tariff_type: Optional[str] = None
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    minimum_hours: Optional[int] = None
    maximum_hours: Optional[int] = None
    free_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    is_default_for_residents: Optional[bool] = None
    is_default_for_guests: Optional[bool] = None

class ParkingTariff(ParkingTariffBase):
    id: int
    # parking_id: int # Временно убрано
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ParkingTariffInDB(ParkingTariff):
    pass

# Схема для расчета стоимости
class TariffCalculationRequest(BaseModel):
    tariff_id: int
    duration_hours: float
    has_subscription: bool = False

class TariffCalculationResponse(BaseModel):
    tariff_name: str
    duration_hours: float
    free_minutes_used: int
    billable_hours: float
    total_cost: float
    tariff_type: str
    breakdown: dict  # Детальная разбивка расчета 