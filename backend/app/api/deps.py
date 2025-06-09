from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from jose import JWTError, jwt

from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.user import User
from app.core.config import settings
from app.models.role import Permission

security = HTTPBearer(auto_error=False)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_employee_from_token(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(None)
) -> Optional[Employee]:
    """
    Получить текущего сотрудника из JWT токена или session cookie
    """
    token = None
    
    if credentials:
        token = credentials.credentials
    elif session_token:
        token = session_token
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        # Получаем employee_id из поля sub (subject)
        employee_id_str = payload.get("sub")
        if employee_id_str is None:
            return None
        
        try:
            employee_id = int(employee_id_str)
        except (ValueError, TypeError):
            return None
    except JWTError:
        return None
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    return employee

def get_current_employee(
    employee: Optional[Employee] = Depends(get_current_employee_from_token)
) -> Employee:
    """
    Получить текущего авторизованного сотрудника (обязательно)
    """
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация"
        )
    return employee

def get_current_valet(
    employee: Employee = Depends(get_current_employee)
) -> Employee:
    """
    Проверить что сотрудник имеет роль валета
    """
    if not employee.role or employee.role.name not in ["valet", "Валет"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для валетов"
        )
    return employee

def get_current_user_optional(
    db: Session = Depends(get_db), 
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Employee]:
    """
    Получить текущего пользователя (необязательно)
    """
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_email: str = payload.get("sub")
        if user_email is None:
            return None
    except JWTError:
        return None
    
    user = db.query(Employee).options(
        joinedload(Employee.role)
    ).filter(Employee.email == user_email).first()
    
    return user

def get_current_user(
    db: Session = Depends(get_db), 
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Employee:
    """
    Получить текущего пользователя (обязательно)
    """
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_email: str = payload.get("sub")
        if user_email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(Employee).options(
        joinedload(Employee.role)
    ).filter(Employee.email == user_email).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def get_current_active_user(current_user: Employee = Depends(get_current_user)) -> Employee:
    """
    Получить текущего активного пользователя
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def check_permission(permission_code: str):
    """
    Декоратор для проверки разрешений
    """
    def permission_checker(current_user: Employee = Depends(get_current_user)) -> Employee:
        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У пользователя нет назначенной роли"
            )
        
        # Проверяем, есть ли у роли пользователя требуемое разрешение
        user_permissions = [p.code for p in current_user.role.permissions]
        
        # Администратор имеет все разрешения
        if current_user.role.name == 'admin':
            return current_user
        
        if permission_code not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав доступа. Требуется разрешение: {permission_code}"
            )
        
        return current_user
    
    return permission_checker

def get_user_permissions(current_user: Employee = Depends(get_current_user)) -> List[str]:
    """
    Получить список разрешений текущего пользователя
    """
    if not current_user.role:
        return []
    
    return [p.code for p in current_user.role.permissions]