from app.db.session import SessionLocal
from sqlalchemy import text

def check_admin():
    db = SessionLocal()
    try:
        print('=== ПРОВЕРКА АДМИНА ===')
        result = db.execute(text('''
            SELECT e.id, e.email, e.first_name, e.last_name, 
                   r.id as role_id, r.name as role_name, r.description
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            WHERE e.email = 'admin@test.com'
        ''')).fetchone()
        
        if result:
            print(f'ID: {result[0]}')
            print(f'Email: {result[1]}')
            print(f'Имя: {result[2]} {result[3]}')
            print(f'Роль ID: {result[4]}')
            print(f'Роль: {result[5]}')
            print(f'Описание роли: {result[6]}')
            
            # Проверяем разрешения роли
            print('\n=== РАЗРЕШЕНИЯ РОЛИ ===')
            perms = db.execute(text(f'''
                SELECT p.code, p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = {result[4]}
                ORDER BY p.code
            ''')).fetchall()
            
            for perm in perms:
                print(f'- {perm[0]} ({perm[1]})')
                
        else:
            print('Админ не найден!')
            
        print('\n=== ВСЕ СОТРУДНИКИ ===')
        all_employees = db.execute(text('''
            SELECT e.email, e.first_name, e.last_name, r.name as role_name
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            ORDER BY e.id
        ''')).fetchall()
        
        for emp in all_employees:
            print(f'{emp[0]} - {emp[1]} {emp[2]} ({emp[3]})')
            
    except Exception as e:
        print(f'Ошибка: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    check_admin() 