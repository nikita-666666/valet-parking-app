#!/usr/bin/env python3
"""
Скрипт для прямой проверки данных в базе
"""

from app.database import SessionLocal
from app.models.valet_session import ValetSession
from app.models.employee import Employee
from app.models.parking_tariff import ParkingTariff
from sqlalchemy.orm import joinedload

def main():
    print("🔍 Прямая проверка данных в базе для сессии ID 36")
    
    db = SessionLocal()
    
    try:
        # Прямой запрос к базе
        session = db.query(ValetSession).filter(ValetSession.id == 36).first()
        
        if session:
            print(f"✅ Сессия найдена:")
            print(f"   Employee ID: {session.employee_id}")
            print(f"   Request accepted by ID: {session.request_accepted_by_id}")
            print(f"   Tariff ID: {session.tariff_id}")
            print(f"   Status: {session.status}")
            
            # Проверяем employee напрямую
            if session.employee_id:
                employee = db.query(Employee).filter(Employee.id == session.employee_id).first()
                if employee:
                    print(f"   Employee найден: {employee.full_name}")
                else:
                    print(f"   Employee с ID {session.employee_id} НЕ найден")
            
            # Проверяем tariff напрямую  
            if session.tariff_id:
                tariff = db.query(ParkingTariff).filter(ParkingTariff.id == session.tariff_id).first()
                if tariff:
                    print(f"   Tariff найден: {tariff.name}")
                else:
                    print(f"   Tariff с ID {session.tariff_id} НЕ найден")
                    
            print("\n🔗 Проверка relationships:")
            # Проверяем relationships
            try:
                print(f"   session.employee: {session.employee}")
                if session.employee:
                    print(f"   session.employee.full_name: {session.employee.full_name}")
            except Exception as e:
                print(f"   Ошибка с session.employee: {e}")
                
            try:
                print(f"   session.tariff: {session.tariff}")
                if session.tariff:
                    print(f"   session.tariff.name: {session.tariff.name}")
            except Exception as e:
                print(f"   Ошибка с session.tariff: {e}")
                
        else:
            print("❌ Сессия не найдена")
            
        # Теперь проверим с joinedload
        print("\n🔄 Проверка с joinedload:")
        session_with_joins = db.query(ValetSession).options(
            joinedload(ValetSession.employee),
            joinedload(ValetSession.request_accepted_by),
            joinedload(ValetSession.tariff)
        ).filter(ValetSession.id == 36).first()
        
        if session_with_joins:
            print(f"   Employee object: {session_with_joins.employee}")
            print(f"   Request accepted by object: {session_with_joins.request_accepted_by}")
            print(f"   Tariff object: {session_with_joins.tariff}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 