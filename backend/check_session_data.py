#!/usr/bin/env python3
"""
Скрипт для проверки данных валет-сессии
"""

import requests
import json
from app.core.security import create_access_token

def main():
    print("🔍 Проверка данных валет-сессии ID 36")
    
    # Создаем токен авторизации
    token = create_access_token({'sub': '1'})
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Запрос к API
        response = requests.get('http://localhost:8000/api/v1/valet-sessions/36', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Employee ID: {data.get('employee_id')}")
            print(f"Employee object: {data.get('employee')}")
            print(f"Request accepted by ID: {data.get('request_accepted_by_id')}")
            print(f"Request accepted by object: {data.get('request_accepted_by')}")
            print(f"Tariff ID: {data.get('tariff_id')}")
            print(f"Tariff object: {data.get('tariff')}")
            print(f"Status: {data.get('status')}")
            
            # Детали сессии
            print("\n📋 Детали сессии:")
            print(f"Car number: {data.get('car_number')}")
            print(f"Car model: {data.get('car_model')}")
            print(f"Client card: {data.get('client_card_number')}")
            print(f"Created at: {data.get('created_at')}")
            print(f"Updated at: {data.get('updated_at')}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    main() 