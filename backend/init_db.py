#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных
"""

import sys
import os

# Добавляем путь к приложению
sys.path.append('/app')

try:
    from app.database import engine
    from app.models.base import Base
    
    print("🔗 Подключение к базе данных...")
    
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    
    print("✅ Таблицы успешно созданы!")
    
    # Выводим список созданных таблиц
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"📋 Создано таблиц: {len(tables)}")
    for table in tables:
        print(f"  - {table}")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1) 