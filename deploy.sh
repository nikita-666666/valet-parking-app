#!/bin/bash

echo "🚀 Развертывание Valet Service"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    exit 1
fi

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | cut -d' ' -f1)
echo "🌐 IP сервера: $SERVER_IP"

# Обновляем конфигурацию
echo "📝 Обновление конфигурации..."
sed -i "s/your-server-ip/$SERVER_IP/g" docker-compose.yml

# Генерируем секретный ключ
SECRET_KEY=$(openssl rand -hex 32)
sed -i "s/your-secret-key-here/$SECRET_KEY/g" docker-compose.yml

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose down
docker-compose up -d --build

# Ждем запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Инициализируем базу данных
echo "💾 Инициализация базы данных..."
docker-compose exec -T backend python -c "
from app.database import engine
from app.models.base import Base
Base.metadata.create_all(bind=engine)
print('✅ Таблицы созданы')
"

# Создаем админ пользователя (если есть скрипт)
if [ -f "backend/check_admin.py" ]; then
    echo "👤 Создание админ пользователя..."
    docker-compose exec -T backend python check_admin.py
fi

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "🌍 Frontend доступен по адресу: http://$SERVER_IP"
echo "🔌 Backend API доступен по адресу: http://$SERVER_IP:8000"
echo "📚 API документация: http://$SERVER_IP:8000/docs"
echo ""
echo "📱 Для тестирования с мобильных устройств используйте: http://$SERVER_IP"
echo ""
echo "🔍 Полезные команды:"
echo "  Просмотр логов: docker-compose logs -f"
echo "  Остановка: docker-compose down"
echo "  Перезапуск: docker-compose restart"
echo "" 