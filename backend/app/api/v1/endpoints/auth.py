from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud.employee import employee
from app.schemas.token import Token
from typing import List

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = employee.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me/permissions", response_model=List[str])
def get_current_user_permissions(
    current_user = Depends(deps.get_current_employee)
) -> List[str]:
    """
    Получить разрешения текущего пользователя
    """
    if not current_user.role:
        return []
    
    return [permission.code for permission in current_user.role.permissions]

@router.get("/me")
def get_current_user_info(
    current_user = Depends(deps.get_current_employee)
):
    """
    Получить информацию о текущем пользователе
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "role": {
            "id": current_user.role.id if current_user.role else None,
            "name": current_user.role.name if current_user.role else None,
            "description": current_user.role.description if current_user.role else None
        } if current_user.role else None
    } 