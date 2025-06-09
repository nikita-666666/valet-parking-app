from app.core.security import verify_password
from app.db.session import SessionLocal
from app.models.employee import Employee

def check_admin_password():
    db = SessionLocal()
    try:
        admin = db.query(Employee).filter(Employee.email == 'admin@test.com').first()
        
        if not admin:
            print("Админ не найден!")
            return
            
        print(f"Админ найден: {admin.email}")
        print(f"Хэш пароля: {admin.hashed_password}")
        
        passwords_to_test = ["admin123", "valet123", "password", "admin", "test"]
        
        for password in passwords_to_test:
            result = verify_password(password, admin.hashed_password)
            print(f"Пароль '{password}': {'✓ ПОДХОДИТ' if result else '✗ не подходит'}")
            
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_password() 