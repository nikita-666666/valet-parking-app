# Multi-stage build для Railway
FROM node:18-alpine AS frontend-build

# Копируем frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем backend requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Копируем backend код
COPY backend/ ./

# Копируем собранный frontend из первого stage
COPY --from=frontend-build /app/frontend/build ./static

# Создаем папку для загрузок
RUN mkdir -p uploads

# Переменные окружения для Railway
ENV PORT=8000
ENV HOST=0.0.0.0
ENV DATABASE_URL=${DATABASE_URL}
ENV SECRET_KEY=${SECRET_KEY}

# Экспонируем порт
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 