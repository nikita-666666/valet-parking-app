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
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем backend код
COPY backend/ ./

# Создаем директории для статики и загрузок
RUN mkdir -p static uploads

# Переменные окружения
ENV PORT=8000
ENV HOST=0.0.0.0

# Экспонируем порт
EXPOSE 8000

# Команда запуска с ожиданием базы данных
COPY backend/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

CMD ["/wait-for-it.sh", "mysql:3306", "--", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
