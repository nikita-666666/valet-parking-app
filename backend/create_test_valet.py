#!/usr/bin/env python3
"""
Скрипт для создания тестового пользователя валет
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.role import Role

def create_test_valet():
    """Создать тестового пользователя валет"""
    db = SessionLocal()
    
    try:
        print("=== Создание тестового валета ===\n")
        
        # Проверяем, есть ли роль валет
        valet_role = db.query(Role).filter(Role.name.in_(["valet", "Валет"])).first()
        
        if not valet_role:
            print("Создаем роль валет...")
            valet_role = Role(
                name="Валет",
                description="Роль для валетов"
            )
            db.add(valet_role)
            db.commit()
            db.refresh(valet_role)
            print(f"✅ Роль валет создана с ID: {valet_role.id}")
        else:
            print(f"✅ Роль валет уже существует: {valet_role.name} (ID: {valet_role.id})")
        
        # Проверяем, есть ли уже пользователь valet@test.com
        existing_valet = db.query(Employee).filter(Employee.email == "valet@test.com").first()
        
        if existing_valet:
            print(f"❌ Пользователь valet@test.com уже существует!")
            print(f"   Имя: {existing_valet.first_name} {existing_valet.last_name}")
            print(f"   Роль: {existing_valet.role.name if existing_valet.role else 'Нет роли'}")
            print(f"   Статус: {'Активен' if existing_valet.is_active else 'Неактивен'}")
            
            # Обновляем роль если нужно
            if not existing_valet.role or existing_valet.role.id != valet_role.id:
                print("Обновляем роль пользователя...")
                existing_valet.role_id = valet_role.id
                existing_valet.is_active = True
                db.commit()
                print("✅ Роль пользователя обновлена")
            
            return
        
        # Создаем нового валета
        print("Создаем нового валета...")
        new_valet = Employee(
            email="valet@test.com",
            first_name="Тест",
            last_name="Валет",
            role_id=valet_role.id,
            is_active=True
        )
        
        db.add(new_valet)
        db.commit()
        db.refresh(new_valet)
        
        print("✅ Тестовый валет создан!")
        print(f"   Email: {new_valet.email}")
        print(f"   Имя: {new_valet.first_name} {new_valet.last_name}")
        print(f"   Роль: {new_valet.role.name}")
        print(f"   Пароль: valet123")
        print(f"   ID: {new_valet.id}")
        
        print("\nТеперь вы можете войти в valet-mobile используя:")
        print("Email: valet@test.com")
        print("Пароль: valet123")
        
    except Exception as e:
        print(f"Ошибка при создании валета: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_valet() 