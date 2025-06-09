#!/usr/bin/env python3
"""
Скрипт для проверки наличия пользователя валет в базе данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.role import Role

def check_valet_users():
    """Проверить наличие пользователей валет в базе данных"""
    db = SessionLocal()
    
    try:
        print("=== Проверка пользователей валет ===\n")
        
        # Проверяем роли
        print("Доступные роли:")
        roles = db.query(Role).all()
        for role in roles:
            print(f"  - ID: {role.id}, Название: {role.name}, Описание: {role.description}")
        
        print("\n" + "="*50 + "\n")
        
        # Проверяем пользователей
        print("Все пользователи:")
        employees = db.query(Employee).all()
        for emp in employees:
            role_name = emp.role.name if emp.role else "Нет роли"
            status = "Активен" if emp.is_active else "Неактивен"
            print(f"  - Email: {emp.email}")
            print(f"    Имя: {emp.first_name} {emp.last_name}")
            print(f"    Роль: {role_name}")
            print(f"    Статус: {status}")
            print()
        
        print("="*50 + "\n")
        
        # Ищем валетов
        print("Пользователи с ролью валет:")
        valet_roles = db.query(Role).filter(Role.name.in_(["valet", "Валет"])).all()
        
        if not valet_roles:
            print("❌ Роли валет не найдены!")
            return
        
        valet_role_ids = [role.id for role in valet_roles]
        valets = db.query(Employee).filter(Employee.role_id.in_(valet_role_ids)).all()
        
        if not valets:
            print("❌ Пользователи с ролью валет не найдены!")
            print("\nДля создания тестового валета выполните:")
            print("python backend/create_test_valet.py")
        else:
            print("✅ Найдены валеты:")
            for valet in valets:
                status = "Активен" if valet.is_active else "Неактивен"
                print(f"  - Email: {valet.email}")
                print(f"    Имя: {valet.first_name} {valet.last_name}")
                print(f"    Статус: {status}")
                print(f"    Пароль для входа: valet123")
                print()
        
    except Exception as e:
        print(f"Ошибка при проверке: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_valet_users() 