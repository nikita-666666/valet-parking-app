from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.role import Role
from app.models.employee import Employee
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/initialize")
def initialize_system(db: Session = Depends(get_db)):
    """
    Первоначальная настройка системы - создание роли админа и пользователя админа
    """
    # Проверяем, не инициализирована ли уже система
    admin_role = db.query(Role).filter(Role.name == 'admin').first()
    if admin_role:
        return {"message": "Система уже инициализирована"}
    
    try:
        # Создаем роль админа
        admin_role = Role(
            name='admin',
            display_name='Администратор',
            description='Полный доступ к системе',
            is_system=True
        )
        db.add(admin_role)
        db.flush()  # Получаем ID роли
        
        # Создаем пользователя админа
        admin_user = Employee(
            email='admin@valet.com',
            first_name='Администратор',
            last_name='Системы',
            hashed_password=get_password_hash('admin123'),
            role_id=admin_role.id,
            is_active=True
        )
        db.add(admin_user)
        
        # Создаем роль валета
        valet_role = Role(
            name='valet',
            display_name='Валет',
            description='Доступ к мобильному приложению валета',
            is_system=True
        )
        db.add(valet_role)
        
        db.commit()
        
        return {
            "message": "Система успешно инициализирована",
            "admin_email": "admin@valet.com",
            "admin_password": "admin123",
            "admin_role_id": admin_role.id,
            "valet_role_id": valet_role.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка инициализации: {str(e)}")

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    """
    Проверить статус инициализации системы
    """
    admin_role = db.query(Role).filter(Role.name == 'admin').first()
    valet_role = db.query(Role).filter(Role.name == 'valet').first()
    admin_user = db.query(Employee).filter(Employee.email == 'admin@valet.com').first()
    
    return {
        "initialized": bool(admin_role and valet_role and admin_user),
        "admin_role_exists": bool(admin_role),
        "valet_role_exists": bool(valet_role),
        "admin_user_exists": bool(admin_user),
        "total_roles": db.query(Role).count(),
        "total_employees": db.query(Employee).count()
    } 