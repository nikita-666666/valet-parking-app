-- Миграция для добавления полей parking_card и has_subscription в таблицу valet_sessions
-- Выполните этот скрипт в вашей базе данных

-- Добавляем поле parking_card (номер парковочной карты)
ALTER TABLE valet_sessions 
ADD COLUMN parking_card VARCHAR(50);

-- Добавляем поле has_subscription (наличие активного абонемента)
ALTER TABLE valet_sessions 
ADD COLUMN has_subscription BOOLEAN NOT NULL DEFAULT FALSE;

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_valet_sessions_parking_card ON valet_sessions(parking_card) 
WHERE parking_card IS NOT NULL;

CREATE INDEX idx_valet_sessions_has_subscription ON valet_sessions(has_subscription);

CREATE INDEX idx_valet_sessions_subscription_status ON valet_sessions(has_subscription, status);

-- Комментарии к полям (для PostgreSQL)
COMMENT ON COLUMN valet_sessions.parking_card IS 'Номер парковочной карты, используемой для оплаты парковки';
COMMENT ON COLUMN valet_sessions.has_subscription IS 'Указывает, есть ли у клиента активный абонемент (true - резидент, false - гостевой)';

-- Опционально: обновляем существующие записи на основе поиска в таблице абонементов
-- Раскомментируйте, если у вас есть таблица subscriptions
/*
UPDATE valet_sessions vs
SET has_subscription = TRUE
WHERE EXISTS (
    SELECT 1 
    FROM subscriptions s 
    WHERE s.car_number = vs.car_number 
    AND s.status = 'active'
    AND s.start_date <= vs.created_at
    AND s.end_date >= vs.created_at
);
*/

-- Проверка результата
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'valet_sessions' 
AND column_name IN ('parking_card', 'has_subscription')
ORDER BY column_name; 