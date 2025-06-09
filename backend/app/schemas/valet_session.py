from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from .parking import ParkingTariff

class PhotoData(BaseModel):
    id: str
    url: str  # URL к файлу фотографии
    filename: Optional[str] = None  # Оригинальное имя файла
    original_name: Optional[str] = None  # Имя загруженного файла
    size: Optional[int] = None
    content_type: Optional[str] = None
    timestamp: Optional[str] = None
    category: Optional[str] = None

class ValetSessionBase(BaseModel):
    car_number: str
    car_model: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_card_number: Optional[str] = None
    parking_spot: Optional[str] = None
    parking_card: Optional[str] = None  # Номер парковочной карты
    has_subscription: Optional[bool] = False  # Есть ли активный абонемент
    notes: Optional[str] = None
    status: Optional[str] = "created"  # created, car_accepted, parked, return_requested, returning, completed, cancelled

class ValetSessionList(BaseModel):
    id: int
    car_number: str
    car_model: str
    session_number: str
    created_at: datetime
    status: str
    client_card_number: Optional[str] = None
    parking_card: Optional[str] = None
    has_subscription: Optional[bool] = False
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True

class ValetSessionCreate(ValetSessionBase):
    # parking_id: Optional[int] = None # Временно убрано
    employee_id: Optional[int] = None
    tariff_id: Optional[int] = None
    photos: Optional[List[PhotoData]] = None
    parking_photos: Optional[List[PhotoData]] = None
    return_start_photos: Optional[List[PhotoData]] = None
    return_delivery_photos: Optional[List[PhotoData]] = None

class ValetSessionUpdate(BaseModel):
    car_model: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_card_number: Optional[str] = None
    parking_spot: Optional[str] = None
    parking_card: Optional[str] = None  # Номер парковочной карты
    has_subscription: Optional[bool] = None  # Есть ли активный абонемент
    notes: Optional[str] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    photos: Optional[List[PhotoData]] = None
    parking_photos: Optional[List[PhotoData]] = None
    return_start_photos: Optional[List[PhotoData]] = None
    return_delivery_photos: Optional[List[PhotoData]] = None

class ValetSession(ValetSessionBase):
    id: int
    # parking_id: int # Временно убрано
    employee_id: Optional[int] = None
    request_accepted_by_id: Optional[int] = None
    session_number: Optional[str] = None
    tariff_id: Optional[int] = None
    photo_url: Optional[str] = None
    photos: Optional[List[PhotoData]] = None
    parking_photos: Optional[List[PhotoData]] = None
    return_start_photos: Optional[List[PhotoData]] = None
    return_delivery_photos: Optional[List[PhotoData]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Поля для стоимости
    calculated_cost: Optional[Decimal] = None
    cost_calculation_details: Optional[Dict[str, Any]] = None
    cost_calculated_at: Optional[datetime] = None
    is_cost_final: Optional[bool] = False
    
    # Поля для оплаты
    payment_status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    paid_amount: Optional[Decimal] = None
    payment_date: Optional[datetime] = None
    payment_reference: Optional[str] = None

    class Config:
        from_attributes = True

class ValetSessionInDB(ValetSession):
    pass

# Схемы для оплаты
class PaymentRequest(BaseModel):
    payment_method: str = "cash"  # cash, card, online
    amount: Optional[Decimal] = None  # Если не указано, используется calculated_cost
    payment_reference: Optional[str] = None

class PaymentResponse(BaseModel):
    success: bool
    message: str
    session_id: int
    paid_amount: Decimal
    remaining_amount: Decimal
    payment_status: str 