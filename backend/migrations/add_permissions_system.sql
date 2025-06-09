-- Создание таблицы разрешений
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание промежуточной таблицы для связи ролей и разрешений
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Обновление таблицы ролей (удаляем JSON поле и добавляем новые поля)
ALTER TABLE roles 
DROP COLUMN IF EXISTS permissions,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Добавление базовых разрешений
INSERT INTO permissions (code, name, description, module) VALUES
-- Валет разрешения
('valet_mobile_access', 'Доступ к мобильному приложению валета', 'Позволяет входить и работать в мобильном приложении валета', 'valet'),
('valet_sessions_view', 'Просмотр валет-сессий', 'Позволяет просматривать список валет-сессий', 'valet'),
('valet_sessions_manage', 'Управление валет-сессиями', 'Позволяет изменять статусы и управлять валет-сессиями', 'valet'),
('valet_sessions_assign', 'Назначение ответственных', 'Позволяет назначать ответственных валетов на сессии', 'valet'),

-- Администрирование
('admin_panel_access', 'Доступ к панели администратора', 'Полный доступ к административной панели', 'admin'),
('roles_manage', 'Управление ролями', 'Создание, редактирование и удаление ролей', 'admin'),
('permissions_manage', 'Управление разрешениями', 'Создание, редактирование и удаление разрешений', 'admin'),
('employees_manage', 'Управление сотрудниками', 'Создание, редактирование и удаление сотрудников', 'admin'),

-- Паркинг
('parking_manage', 'Управление парковками', 'Создание, редактирование и удаление парковок', 'parking'),
('tariffs_manage', 'Управление тарифами', 'Создание, редактирование и удаление тарифов', 'parking'),

-- Клиенты и абонементы
('clients_manage', 'Управление клиентами', 'Просмотр и редактирование данных клиентов', 'client'),
('subscriptions_manage', 'Управление абонементами', 'Создание, редактирование и удаление абонементов', 'client'),

-- Отчеты
('reports_view', 'Просмотр отчетов', 'Доступ к просмотру отчетов и аналитики', 'reports');

-- Создание базовых ролей
-- Обновляем существующие роли или создаем новые
INSERT INTO roles (name, description, is_system, is_active) VALUES
('admin', 'Администратор системы', TRUE, TRUE),
('senior_valet', 'Старший валет', TRUE, TRUE),
('valet', 'Валет', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    is_system = VALUES(is_system),
    is_active = VALUES(is_active);

-- Назначение разрешений администратору (все разрешения)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Назначение разрешений старшему валету
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'valet_mobile_access',
    'valet_sessions_view', 
    'valet_sessions_manage',
    'valet_sessions_assign',
    'reports_view'
)
WHERE r.name = 'senior_valet'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Назначение разрешений обычному валету
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'valet_mobile_access'
)
WHERE r.name = 'valet'
ON DUPLICATE KEY UPDATE role_id = role_id; 