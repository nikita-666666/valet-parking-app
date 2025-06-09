import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_create_location():
    # Создаем локацию
    location_data = {
        "name": "Тестовая локация",
        "address": "ул. Пушкина, д. 1",
        "description": "Тестовое описание",
        "status": "active"
    }
    
    response = requests.post(
        f"{BASE_URL}/locations/",
        json=location_data
    )
    print("Create location response:", response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # Сохраняем ID созданной локации
    location_id = response.json()["id"]
    
    # Получаем информацию о локации
    response = requests.get(f"{BASE_URL}/locations/{location_id}")
    print("\nGet location response:", response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # Обновляем локацию
    update_data = {
        "name": "Обновленная локация",
        "description": "Новое описание"
    }
    response = requests.put(
        f"{BASE_URL}/locations/{location_id}",
        json=update_data
    )
    print("\nUpdate location response:", response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # Получаем список всех локаций
    response = requests.get(f"{BASE_URL}/locations/")
    print("\nGet all locations response:", response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # Удаляем локацию
    response = requests.delete(f"{BASE_URL}/locations/{location_id}")
    print("\nDelete location response:", response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_create_location()