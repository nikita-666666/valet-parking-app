#!/usr/bin/env python3
"""
Скрипт для проверки API тарифов
"""

import requests
import json

def main():
    print("🔍 Проверка API тарифов")
    
    try:
        # Проверяем без авторизации
        print("\n1. Запрос без авторизации:")
        response = requests.get('http://localhost:8000/api/v1/parking-tariffs/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Количество тарифов: {len(data)}")
            for tariff in data[:3]:  # Показываем первые 3
                print(f"  - {tariff.get('name')} ({tariff.get('tariff_type')})")
        else:
            print(f"Ошибка: {response.text}")
        
        # Проверяем с токеном
        print("\n2. Запрос с токеном:")
        try:
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from app.core.security import create_access_token
            
            token = create_access_token({'sub': '1'})
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get('http://localhost:8000/api/v1/parking-tariffs/', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Количество тарифов: {len(data)}")
                for tariff in data[:3]:
                    print(f"  - {tariff.get('name')} ({tariff.get('tariff_type')})")
            else:
                print(f"Ошибка: {response.text}")
        except Exception as e:
            print(f"Ошибка создания токена: {e}")
            
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    main() 