-- Добавление поля car_color в таблицу valet_sessions
ALTER TABLE valet_sessions ADD COLUMN car_color VARCHAR(50) AFTER car_model; 