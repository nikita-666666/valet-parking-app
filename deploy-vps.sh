#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚗 Развертывание Valet Parking System на VPS${NC}"
echo "================================================"

# Проверка что мы в правильной директории
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Файл docker-compose.prod.yml не найден!${NC}"
    echo "Убедитесь что вы в корневой директории проекта"
    exit 1
fi

# Остановка старых контейнеров
echo -e "${YELLOW}🛑 Остановка старых контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml down

# Сборка образов
echo -e "${YELLOW}🔨 Сборка образов...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Создание директорий
echo -e "${YELLOW}📁 Создание необходимых директорий...${NC}"
mkdir -p backend/uploads/valet_photos

# Сборка frontend (если есть)
if [ -d "frontend" ]; then
    echo -e "${YELLOW}🎨 Сборка frontend...${NC}"
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        npm run build
    fi
    cd ..
fi

# Запуск контейнеров
echo -e "${YELLOW}🚀 Запуск контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Ожидание запуска MySQL
echo -e "${YELLOW}⏳ Ожидание запуска базы данных...${NC}"
sleep 30

# Проверка состояния
echo -e "${YELLOW}🔍 Проверка состояния контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Тест подключения
echo -e "${YELLOW}🔌 Тестирование подключения...${NC}"
sleep 10

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend запущен успешно!${NC}"
else
    echo -e "${RED}❌ Backend не отвечает${NC}"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx запущен успешно!${NC}"
else
    echo -e "${RED}❌ Nginx не отвечает${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Развертывание завершено!${NC}"
echo "================================================"
echo -e "${BLUE}📱 Ваше приложение доступно по адресу:${NC}"
echo -e "🌐 Основное приложение: ${GREEN}http://your-server-ip${NC}"
echo -e "📊 API документация: ${GREEN}http://your-server-ip/docs${NC}"
echo -e "🔧 Health check: ${GREEN}http://your-server-ip/health${NC}"
echo ""
echo -e "${YELLOW}👤 Тестовые данные для входа:${NC}"
echo -e "Email: ${BLUE}valet@test.com${NC}"
echo -e "Password: ${BLUE}valet123${NC}"
echo ""
echo -e "${YELLOW}📋 Полезные команды:${NC}"
echo "Просмотр логов: docker-compose -f docker-compose.prod.yml logs -f"
echo "Остановка: docker-compose -f docker-compose.prod.yml down"
echo "Перезапуск: docker-compose -f docker-compose.prod.yml restart" 