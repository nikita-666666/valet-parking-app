from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from app.api.deps import get_db, get_current_valet
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models.employee import Employee

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ValetLoginRequest(BaseModel):
    email: str
    password: str

class ValetLoginResponse(BaseModel):
    access_token: str
    token_type: str
    employee: dict

class ValetProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_name: str
    location: str
    is_on_shift: bool = False

@router.post("/login", response_model=ValetLoginResponse)
def valet_login(
    *,
    db: Session = Depends(get_db),
    form_data: ValetLoginRequest,
    response: Response
):
    """
    Авторизация валета
    """
    logger.info(f"Попытка авторизации валета с email: {form_data.email}")
    
    employee = db.query(Employee).filter(Employee.email == form_data.email).first()
    
    if not employee:
        logger.warning(f"Пользователь с email {form_data.email} не найден")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    logger.info(f"Пользователь найден: {employee.email}, роль: {employee.role.name if employee.role else 'Нет роли'}")
    
    # Для демо будем использовать простую проверку пароля
    if form_data.password != "valet123":
        logger.warning(f"Неверный пароль для пользователя {form_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    if not employee.role:
        logger.error(f"У пользователя {form_data.email} не назначена роль")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У пользователя не назначена роль"
        )
    
    # Исправляем проверку роли - теперь проверяем на "Валет"
    if employee.role.name not in ["valet", "Валет"]:
        logger.warning(f"Пользователь {form_data.email} имеет неподходящую роль: {employee.role.name}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Доступ только для валетов. Ваша роль: {employee.role.name}"
        )
    
    if not employee.is_active:
        logger.warning(f"Аккаунт пользователя {form_data.email} заблокирован")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Аккаунт заблокирован"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=employee.id, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="session_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax"
    )
    
    logger.info(f"Успешная авторизация валета: {employee.email}")
    
    return ValetLoginResponse(
        access_token=access_token,
        token_type="bearer",
        employee={
            "id": employee.id,
            "full_name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "role": employee.role.name,
            "location": "Жилой Квартал Prime Park"
        }
    )

@router.get("/profile", response_model=ValetProfileResponse)
def get_valet_profile(
    employee: Employee = Depends(get_current_valet),
    db: Session = Depends(get_db)
):
    """
    Получить профиль валета
    """
    logger.info(f"Запрос профиля валета: {employee.email}")
    
    return ValetProfileResponse(
        id=employee.id,
        full_name=employee.full_name,
        email=employee.email,
        role_name=employee.role.name,
        location="Жилой Квартал Prime Park",
        is_on_shift=True  # В будущем добавим логику смен
    )

@router.post("/logout")
def valet_logout(response: Response):
    """
    Выход из системы
    """
    response.delete_cookie(key="session_token")
    return {"message": "Успешный выход"} 