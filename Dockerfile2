# Используем официальный Python образ
FROM python:3.11-slim

# Установка только необходимых зависимостей одной командой
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# Создаем рабочую директорию
WORKDIR /app

# Копируем и устанавливаем минимальные Python зависимости
COPY backend/requirements-minimal.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем backend код
COPY backend/ ./

# Создаем простую статическую папку с базовым HTML
RUN mkdir -p static uploads && \
    echo '<!DOCTYPE html><html><head><title>Valet Parking System</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><h1>🚗 Valet Parking System</h1><p>API работает! <a href="/docs">Документация API</a></p></body></html>' > static/index.html

# Переменные окружения
ENV PORT=8000
ENV HOST=0.0.0.0

# Экспонируем порт
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 