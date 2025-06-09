-- Создание таблицы логов валет-сессий
CREATE TABLE IF NOT EXISTS valet_session_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES valet_sessions(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_valet_session_logs_session_id ON valet_session_logs(session_id);
CREATE INDEX idx_valet_session_logs_created_at ON valet_session_logs(created_at);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_valet_session_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_valet_session_logs_updated_at
    BEFORE UPDATE ON valet_session_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_valet_session_logs_updated_at(); 