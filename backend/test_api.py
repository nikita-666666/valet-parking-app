import requests
import json

def test_admin_login():
    url = "http://localhost:8000/api/v1/auth/login"
    
    # Данные для авторизации
    data = {
        "username": "admin@test.com",
        "password": "valet123"
    }
    
    print("🔄 Тестируем авторизацию админа...")
    print(f"URL: {url}")
    print(f"Данные: {data}")
    
    try:
        response = requests.post(
            url, 
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ УСПЕШНАЯ АВТОРИЗАЦИЯ!")
            print(f"Токен: {result['access_token'][:50]}...")
            print(f"Тип токена: {result['token_type']}")
            
            # Тестируем получение профиля
            print("\n🔄 Тестируем получение профиля...")
            
            profile_response = requests.get(
                "http://localhost:8000/api/v1/auth/me",
                headers={"Authorization": f"Bearer {result['access_token']}"}
            )
            
            print(f"Статус профиля: {profile_response.status_code}")
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                print("✅ ПРОФИЛЬ ПОЛУЧЕН!")
                print(f"ID: {profile['id']}")
                print(f"Email: {profile['email']}")
                print(f"Имя: {profile['first_name']} {profile['last_name']}")
                print(f"Роль: {profile['role']['name'] if profile['role'] else 'Нет роли'}")
            else:
                print(f"❌ Ошибка получения профиля: {profile_response.text}")
                
            # Тестируем получение разрешений
            print("\n🔄 Тестируем получение разрешений...")
            
            permissions_response = requests.get(
                "http://localhost:8000/api/v1/auth/me/permissions",
                headers={"Authorization": f"Bearer {result['access_token']}"}
            )
            
            print(f"Статус разрешений: {permissions_response.status_code}")
            
            if permissions_response.status_code == 200:
                permissions = permissions_response.json()
                print("✅ РАЗРЕШЕНИЯ ПОЛУЧЕНЫ!")
                print(f"Количество разрешений: {len(permissions)}")
                for perm in permissions:
                    print(f"  • {perm}")
            else:
                print(f"❌ Ошибка получения разрешений: {permissions_response.text}")
            
        else:
            print(f"❌ ОШИБКА АВТОРИЗАЦИИ: {response.status_code}")
            print(f"Текст ошибки: {response.text}")
            
    except Exception as e:
        print(f"💥 ОШИБКА СЕТИ: {e}")

if __name__ == "__main__":
    test_admin_login() 