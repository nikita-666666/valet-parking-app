from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_user_optional, get_current_employee
from app.crud.role import role, permission
from app.schemas.role import (
    Role,
    RoleCreate,
    RoleUpdate,
    RoleSimple,
    Permission,
    PermissionCreate,
    PermissionUpdate
)
from app.models.employee import Employee

router = APIRouter()

# Роли
@router.get("/", response_model=List[Role])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[Employee] = Depends(get_current_user_optional),
):
    """
    Получить список ролей
    """
    roles = role.get_multi_with_permissions(db, skip=skip, limit=limit)
    return roles

@router.post("/", response_model=Role)
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: RoleCreate,
    current_user: Employee = Depends(get_current_employee),
):
    """
    Создать новую роль
    """
    # Проверка разрешений - только администраторы могут создавать роли
    # Если в системе нет ролей, разрешаем создание первой роли
    from app.models.role import Role as RoleModel
    existing_roles_count = db.query(RoleModel).count()
    if existing_roles_count > 0 and (not current_user.role or current_user.role.name != 'admin'):
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для создания ролей"
        )
    
    # Проверяем, что роль с таким именем не существует
    existing_role = role.get_by_name(db, name=role_in.name)
    if existing_role:
        raise HTTPException(
            status_code=400,
            detail="Роль с таким именем уже существует"
        )
    
    return role.create_with_permissions(db=db, obj_in=role_in)

@router.get("/{role_id}", response_model=Role)
def read_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: Optional[Employee] = Depends(get_current_user_optional),
):
    """
    Получить роль по ID
    """
    role_obj = role.get_with_permissions(db=db, id=role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    return role_obj

@router.put("/{role_id}", response_model=Role)
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: RoleUpdate,
    current_user: Employee = Depends(get_current_employee),
):
    """
    Обновить роль
    """
    # Проверка разрешений
    if not current_user.role or current_user.role.name != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для редактирования ролей"
        )
    
    role_obj = role.get(db=db, id=role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    # Запрещаем изменение системных ролей
    if role_obj.is_system:
        raise HTTPException(
            status_code=400,
            detail="Нельзя изменять системные роли"
        )
    
    return role.update_with_permissions(db=db, db_obj=role_obj, obj_in=role_in)

@router.delete("/{role_id}")
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: Employee = Depends(get_current_employee),
):
    """
    Удалить роль
    """
    # Проверка разрешений
    if not current_user.role or current_user.role.name != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для удаления ролей"
        )
    
    role_obj = role.get(db=db, id=role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    # Запрещаем удаление системных ролей
    if role_obj.is_system:
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалять системные роли"
        )
    
    # Проверяем, что у роли нет назначенных сотрудников
    if role_obj.employees:
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить роль, назначенную сотрудникам"
        )
    
    role.remove(db=db, id=role_id)
    return {"message": "Роль успешно удалена"}

# Разрешения
@router.get("/permissions/", response_model=List[Permission])
def read_permissions(
    db: Session = Depends(get_db),
    module: str = None,
    current_user: Optional[Employee] = Depends(get_current_user_optional),
):
    """
    Получить список разрешений
    """
    if module:
        permissions = permission.get_by_module(db, module=module)
    else:
        permissions = permission.get_active(db)
    return permissions

@router.post("/permissions/", response_model=Permission)
def create_permission(
    *,
    db: Session = Depends(get_db),
    permission_in: PermissionCreate,
    current_user: Employee = Depends(get_current_employee),
):
    """
    Создать новое разрешение
    """
    # Проверка разрешений
    if not current_user.role or current_user.role.name != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для создания разрешений"
        )
    
    # Проверяем, что разрешение с таким кодом не существует
    existing_permission = permission.get_by_code(db, code=permission_in.code)
    if existing_permission:
        raise HTTPException(
            status_code=400,
            detail="Разрешение с таким кодом уже существует"
        )
    
    return permission.create(db=db, obj_in=permission_in)

# Простые роли для селектов
@router.get("/simple/", response_model=List[RoleSimple])
def read_roles_simple(
    db: Session = Depends(get_db),
):
    """
    Получить упрощенный список ролей для селектов
    """
    roles = role.get_multi(db)
    return roles 