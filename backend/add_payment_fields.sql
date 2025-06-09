-- Добавление полей оплаты в таблицу valet_sessions

USE get_wallet;

-- Добавляем поля для оплаты
ALTER TABLE valet_sessions 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' COMMENT 'Статус оплаты: pending, paid, partial';

ALTER TABLE valet_sessions 
ADD COLUMN payment_method VARCHAR(50) NULL COMMENT 'Способ оплаты: cash, card, online, etc.';

ALTER TABLE valet_sessions 
ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Сумма оплаты';

ALTER TABLE valet_sessions 
ADD COLUMN payment_date DATETIME NULL COMMENT 'Дата оплаты';

ALTER TABLE valet_sessions 
ADD COLUMN payment_reference VARCHAR(100) NULL COMMENT 'Номер транзакции/чека';

-- Проверяем результат
DESCRIBE valet_sessions;

-- Опционально: обновляем существующие записи
UPDATE valet_sessions 
SET payment_status = 'pending', paid_amount = 0.00 
WHERE payment_status IS NULL; 