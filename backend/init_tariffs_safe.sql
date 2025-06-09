-- Безопасная инициализация базовых тарифов для валет-парковки
-- Этот файл можно выполнить несколько раз без ошибок

-- Создаем таблицу parkings если её нет (минимальная структура)
CREATE TABLE IF NOT EXISTS parkings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Убедимся, что у нас есть парковка с ID = 1
INSERT IGNORE INTO parkings (id, name, address, is_active, created_at, updated_at) 
VALUES (1, 'Главная парковка', 'ул. Парковочная, 1', true, NOW(), NOW());

-- Сбрасываем текущие тарифы по умолчанию (если есть)
UPDATE parking_tariffs SET is_default_for_residents = false, is_default_for_guests = false WHERE parking_id = 1;

-- 1. Бесплатный тариф для резидентов
INSERT INTO parking_tariffs (
    name, description, tariff_type, price_per_hour, price_per_day, 
    minimum_hours, maximum_hours, free_minutes, is_active, 
    is_default_for_residents, is_default_for_guests, parking_id, created_at, updated_at
) VALUES (
    'Резидент - Бесплатно', 
    'Бесплатная парковка для жителей комплекса с абонементом', 
    'free', 0.0, 0.0, 1, NULL, 0, true, true, false, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    tariff_type = VALUES(tariff_type),
    price_per_hour = VALUES(price_per_hour),
    is_default_for_residents = VALUES(is_default_for_residents),
    updated_at = NOW();

-- 2. Стандартный почасовой тариф для гостей  
INSERT INTO parking_tariffs (
    name, description, tariff_type, price_per_hour, price_per_day, 
    minimum_hours, maximum_hours, free_minutes, is_active, 
    is_default_for_residents, is_default_for_guests, parking_id, created_at, updated_at
) VALUES (
    'Гостевой - Стандарт', 
    'Стандартный почасовой тариф для гостей с первыми 30 минутами бесплатно', 
    'hourly', 150.0, 0.0, 1, 24, 30, true, false, true, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    tariff_type = VALUES(tariff_type),
    price_per_hour = VALUES(price_per_hour),
    free_minutes = VALUES(free_minutes),
    is_default_for_guests = VALUES(is_default_for_guests),
    updated_at = NOW();

-- 3. Суточный тариф для длительной парковки
INSERT INTO parking_tariffs (
    name, description, tariff_type, price_per_hour, price_per_day, 
    minimum_hours, maximum_hours, free_minutes, is_active, 
    is_default_for_residents, is_default_for_guests, parking_id, created_at, updated_at
) VALUES (
    'Суточный тариф', 
    'Выгодный тариф для длительной парковки свыше 8 часов', 
    'daily', 150.0, 1000.0, 8, NULL, 30, true, false, false, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    tariff_type = VALUES(tariff_type),
    price_per_hour = VALUES(price_per_hour),
    price_per_day = VALUES(price_per_day),
    minimum_hours = VALUES(minimum_hours),
    free_minutes = VALUES(free_minutes),
    updated_at = NOW();

-- 4. VIP тариф с расширенными услугами
INSERT INTO parking_tariffs (
    name, description, tariff_type, price_per_hour, price_per_day, 
    minimum_hours, maximum_hours, free_minutes, is_active, 
    is_default_for_residents, is_default_for_guests, parking_id, created_at, updated_at
) VALUES (
    'VIP Сервис', 
    'Премиум обслуживание с дополнительными услугами (мойка, заправка)', 
    'vip', 300.0, 2500.0, 1, NULL, 60, true, false, false, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    tariff_type = VALUES(tariff_type),
    price_per_hour = VALUES(price_per_hour),
    price_per_day = VALUES(price_per_day),
    free_minutes = VALUES(free_minutes),
    updated_at = NOW();

-- 5. Льготный тариф для резидентов (если нужна частичная оплата)
INSERT INTO parking_tariffs (
    name, description, tariff_type, price_per_hour, price_per_day, 
    minimum_hours, maximum_hours, free_minutes, is_active, 
    is_default_for_residents, is_default_for_guests, parking_id, created_at, updated_at
) VALUES (
    'Резидент - Льготный', 
    'Льготный тариф для резидентов с частичной оплатой', 
    'hourly', 50.0, 0.0, 1, NULL, 120, true, false, false, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    tariff_type = VALUES(tariff_type),
    price_per_hour = VALUES(price_per_hour),
    free_minutes = VALUES(free_minutes),
    updated_at = NOW();

-- Проверяем результат
SELECT 'Тарифы успешно созданы!' as message;
SELECT COUNT(*) as total_tariffs FROM parking_tariffs;
SELECT 
    name, 
    tariff_type, 
    price_per_hour, 
    CASE WHEN is_default_for_residents THEN 'Да' ELSE 'Нет' END as 'По умолчанию для резидентов',
    CASE WHEN is_default_for_guests THEN 'Да' ELSE 'Нет' END as 'По умолчанию для гостей'
FROM parking_tariffs 
WHERE parking_id = 1
ORDER BY 
    CASE tariff_type 
        WHEN 'free' THEN 1 
        WHEN 'hourly' THEN 2 
        WHEN 'daily' THEN 3 
        WHEN 'vip' THEN 4 
        ELSE 5 
    END; 