from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db

router = APIRouter()

class ClientRequestCreate(BaseModel):
    client_name: str
    client_phone: str
    car_number: str
    car_model: str = None
    location: str
    notes: str = None
    service_time: str = None

class ClientRequestResponse(BaseModel):
    message: str
    request_id: str

@router.post("/", response_model=ClientRequestResponse)
def create_client_request(
    *,
    db: Session = Depends(get_db),
    request_in: ClientRequestCreate,
):
    """
    Создать заявку от клиента на валет-парковку
    """
    
    # В реальном приложении здесь будет сохранение в базу
    # Пока просто возвращаем успешный ответ
    
    import uuid
    request_id = str(uuid.uuid4())[:8].upper()
    
    # Здесь можно добавить логику:
    # - Сохранение заявки в базу
    # - Отправка SMS/email уведомлений
    # - Создание задачи для оператора
    
    return ClientRequestResponse(
        message="Заявка успешно принята! Мы свяжемся с вами в течение 5 минут.",
        request_id=request_id
    ) 