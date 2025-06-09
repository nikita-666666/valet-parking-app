from typing import List, Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.role import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate

class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    def __init__(self, model):
        super().__init__(model)

    def create_with_permissions(
        self, db: Session, *, obj_in: RoleCreate
    ) -> Role:
        # Создаем роль
        db_obj = Role(
            name=obj_in.name,
            description=obj_in.description,
            is_active=obj_in.is_active
        )
        db.add(db_obj)
        db.flush()  # Получаем ID роли
        
        # Добавляем разрешения
        if obj_in.permission_ids:
            permissions = db.query(Permission).filter(
                Permission.id.in_(obj_in.permission_ids)
            ).all()
            db_obj.permissions = permissions
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_with_permissions(
        self, db: Session, *, db_obj: Role, obj_in: RoleUpdate
    ) -> Role:
        # Обновляем основные поля
        if obj_in.name is not None:
            db_obj.name = obj_in.name
        if obj_in.description is not None:
            db_obj.description = obj_in.description
        if obj_in.is_active is not None:
            db_obj.is_active = obj_in.is_active
        
        # Обновляем разрешения
        if obj_in.permission_ids is not None:
            permissions = db.query(Permission).filter(
                Permission.id.in_(obj_in.permission_ids)
            ).all()
            db_obj.permissions = permissions
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_with_permissions(self, db: Session, id: int) -> Optional[Role]:
        return db.query(Role).options(
            joinedload(Role.permissions)
        ).filter(Role.id == id).first()
    
    def get_multi_with_permissions(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Role]:
        return db.query(Role).options(
            joinedload(Role.permissions)
        ).offset(skip).limit(limit).all()
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Role]:
        return db.query(Role).filter(Role.name == name).first()

class CRUDPermission(CRUDBase[Permission, dict, dict]):
    def get_by_code(self, db: Session, *, code: str) -> Optional[Permission]:
        return db.query(Permission).filter(Permission.code == code).first()
    
    def get_by_module(self, db: Session, *, module: str) -> List[Permission]:
        return db.query(Permission).filter(Permission.module == module).all()
    
    def get_active(self, db: Session) -> List[Permission]:
        return db.query(Permission).filter(Permission.is_active == True).all()

role = CRUDRole(Role)
permission = CRUDPermission(Permission) 