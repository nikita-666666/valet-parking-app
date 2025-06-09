-- Добавляем недостающую колонку is_system в таблицу roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE;

-- Очищаем старые разрешения (они не связаны внешними ключами)
DELETE FROM role_permissions;
DELETE FROM permissions;

-- Сбрасываем автоинкремент для permissions
ALTER TABLE permissions AUTO_INCREMENT = 1;

-- Создаем базовые разрешения
INSERT INTO permissions (code, name, description, module, is_active, created_at, updated_at) VALUES
-- Администрирование
('admin.dashboard.view', 'Просмотр дашборда', 'Доступ к главной панели управления', 'admin', TRUE, NOW(), NOW()),
('admin.users.manage', 'Управление пользователями', 'Создание, редактирование и удаление пользователей', 'admin', TRUE, NOW(), NOW()),
('admin.roles.manage', 'Управление ролями', 'Создание и редактирование ролей', 'admin', TRUE, NOW(), NOW()),
('admin.system.settings', 'Системные настройки', 'Доступ к настройкам системы', 'admin', TRUE, NOW(), NOW()),

-- Валет-услуги
('valet.sessions.view', 'Просмотр валет-сессий', 'Просмотр списка валет-сессий', 'valet', TRUE, NOW(), NOW()),
('valet.sessions.manage', 'Управление валет-сессиями', 'Создание и управление валет-сессиями', 'valet', TRUE, NOW(), NOW()),
('valet.car.accept', 'Принятие автомобилей', 'Принятие автомобилей на валет-парковку', 'valet', TRUE, NOW(), NOW()),
('valet.car.park', 'Парковка автомобилей', 'Размещение автомобилей на парковочных местах', 'valet', TRUE, NOW(), NOW()),
('valet.car.return', 'Подача автомобилей', 'Подача автомобилей клиентам', 'valet', TRUE, NOW(), NOW()),
('valet.photos.upload', 'Загрузка фото', 'Загрузка фотографий автомобилей', 'valet', TRUE, NOW(), NOW()),

-- Парковка
('parking.spots.view', 'Просмотр парковочных мест', 'Просмотр информации о парковочных местах', 'parking', TRUE, NOW(), NOW()),
('parking.spots.manage', 'Управление парковочными местами', 'Управление парковочными местами', 'parking', TRUE, NOW(), NOW()),

-- Клиенты
('client.view', 'Просмотр клиентов', 'Просмотр информации о клиентах', 'client', TRUE, NOW(), NOW()),
('client.manage', 'Управление клиентами', 'Создание и редактирование клиентов', 'client', TRUE, NOW(), NOW()),
('client.subscriptions.view', 'Просмотр абонементов', 'Просмотр абонементов клиентов', 'client', TRUE, NOW(), NOW()),
('client.subscriptions.manage', 'Управление абонементами', 'Создание и управление абонементами', 'client', TRUE, NOW(), NOW()),

-- Отчеты
('reports.view', 'Просмотр отчетов', 'Доступ к отчетам и аналитике', 'reports', TRUE, NOW(), NOW()),
('reports.export', 'Экспорт отчетов', 'Экспорт отчетов в различные форматы', 'reports', TRUE, NOW(), NOW());

-- Обновляем существующие роли или создаем новые
INSERT INTO roles (name, description, is_active, is_system, created_at, updated_at) VALUES
('admin', 'Администратор системы - полный доступ ко всем функциям', TRUE, TRUE, NOW(), NOW()),
('valet', 'Валет - сотрудник валет-парковки', TRUE, TRUE, NOW(), NOW()),
('senior_valet', 'Старший валет - валет с расширенными правами', TRUE, TRUE, NOW(), NOW()),
('manager', 'Менеджер - управление операциями', TRUE, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
description = VALUES(description),
is_system = TRUE,
updated_at = NOW();

-- Получаем ID ролей для назначения разрешений
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @valet_role_id = (SELECT id FROM roles WHERE name = 'valet' LIMIT 1);
SET @senior_valet_role_id = (SELECT id FROM roles WHERE name = 'senior_valet' LIMIT 1);
SET @manager_role_id = (SELECT id FROM roles WHERE name = 'manager' LIMIT 1);

-- Администратор получает все разрешения
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @admin_role_id as role_id, id as permission_id, NOW() as created_at, NOW() as updated_at
FROM permissions;

-- Валет получает базовые разрешения для работы
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @valet_role_id as role_id, id as permission_id, NOW() as created_at, NOW() as updated_at
FROM permissions 
WHERE code IN (
    'valet.sessions.view',
    'valet.sessions.manage', 
    'valet.car.accept',
    'valet.car.park',
    'valet.car.return',
    'valet.photos.upload',
    'parking.spots.view'
);

-- Старший валет получает дополнительные разрешения
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @senior_valet_role_id as role_id, id as permission_id, NOW() as created_at, NOW() as updated_at
FROM permissions 
WHERE code IN (
    'valet.sessions.view',
    'valet.sessions.manage',
    'valet.car.accept',
    'valet.car.park', 
    'valet.car.return',
    'valet.photos.upload',
    'parking.spots.view',
    'parking.spots.manage',
    'client.view',
    'reports.view'
);

-- Менеджер получает управленческие разрешения
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @manager_role_id as role_id, id as permission_id, NOW() as created_at, NOW() as updated_at
FROM permissions 
WHERE code IN (
    'admin.dashboard.view',
    'valet.sessions.view',
    'valet.sessions.manage',
    'client.view',
    'client.manage',
    'client.subscriptions.view',
    'client.subscriptions.manage',
    'parking.spots.view',
    'parking.spots.manage',
    'reports.view',
    'reports.export'
);

-- Назначаем роли существующим сотрудникам
UPDATE employees SET role_id = @admin_role_id WHERE email LIKE '%admin%' OR first_name LIKE '%admin%';
UPDATE employees SET role_id = @valet_role_id WHERE role_id IS NULL AND first_name NOT LIKE '%admin%';

-- Создаем тестового валета если его нет
INSERT IGNORE INTO employees (email, first_name, last_name, hashed_password, role_id, is_active, created_at, updated_at)
VALUES ('valet@test.com', 'Тест', 'Валетов', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.LRwqBsxpfm4u0VKoo', @valet_role_id, TRUE, NOW(), NOW());

-- Создаем тестового администратора если его нет  
INSERT IGNORE INTO employees (email, first_name, last_name, hashed_password, role_id, is_active, created_at, updated_at)
VALUES ('admin@test.com', 'Админ', 'Системы', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.LRwqBsxpfm4u0VKoo', @admin_role_id, TRUE, NOW(), NOW());

-- Проверяем результат
SELECT 'Roles created:' as info;
SELECT id, name, description, is_system FROM roles;

SELECT 'Permissions created:' as info;
SELECT COUNT(*) as permission_count FROM permissions;

SELECT 'Role permissions assigned:' as info;
SELECT r.name as role_name, COUNT(rp.permission_id) as permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name;

SELECT 'Employees with roles:' as info;
SELECT e.email, e.first_name, e.last_name, r.name as role_name
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id; 