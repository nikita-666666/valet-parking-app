from typing import List, Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.crud.base import CRUDBase
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.security import get_password_hash, verify_password

class CRUDEmployee(CRUDBase):
    def __init__(self):
        super().__init__(Employee)
        
    def create(self, db: Session, *, obj_in: EmployeeCreate) -> Employee:
        db_obj = Employee(
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            role_id=obj_in.role_id,
            is_active=obj_in.is_active,
            available_locations=obj_in.available_locations,
            telegram_id=obj_in.telegram_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def remove(self, db: Session, *, id: int) -> Employee:
        obj = db.query(Employee).filter(Employee.id == id).first()
        if not obj:
            return None
            
        # Проверяем, есть ли у сотрудника активные валет-сессии
        from app.models.valet_session import ValetSession
        active_sessions = db.query(ValetSession).filter(
            ValetSession.employee_id == id,
            ValetSession.status.in_(["created", "in_progress", "parked"])
        ).count()
        
        if active_sessions > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Невозможно удалить сотрудника. У него есть {active_sessions} активных валет-сессий. Сначала завершите все сессии."
            )
        
        # Если нет активных сессий, можно безопасно удалить
        # Устанавливаем is_active = False вместо полного удаления
        obj.is_active = False
        db.commit()
        db.refresh(obj)
        return obj
        
    def hard_delete(self, db: Session, *, id: int) -> Employee:
        """Полное удаление сотрудника (только если нет связанных данных)"""
        obj = db.query(Employee).filter(Employee.id == id).first()
        if not obj:
            return None
            
        # Проверяем наличие любых валет-сессий
        from app.models.valet_session import ValetSession
        any_sessions = db.query(ValetSession).filter(ValetSession.employee_id == id).count()
        
        if any_sessions > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Невозможно удалить сотрудника. У него есть {any_sessions} валет-сессий в истории."
            )
        
        db.delete(obj)
        db.commit()
        return obj
        
    def get_by_email(self, db: Session, *, email: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.email == email).first()

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[Employee]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

employee = CRUDEmployee() 