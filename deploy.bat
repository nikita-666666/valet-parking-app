@echo off
echo 🚀 Развертывание Valet Service (MySQL)

REM Проверяем наличие Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker не установлен. Установите Docker Desktop и повторите попытку.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose не установлен. Установите Docker Desktop и повторите попытку.
    pause
    exit /b 1
)

echo 📝 Остановка старых контейнеров...
docker-compose down

echo 🔨 Сборка и запуск контейнеров...
docker-compose up -d --build

REM Ждем запуска сервисов
echo ⏳ Ожидание запуска MySQL и Backend (45 секунд)...
timeout /t 45 /nobreak

REM Инициализируем базу данных
echo 💾 Инициализация базы данных...
docker-compose exec -T backend python -c "from app.database import engine; from app.models.base import Base; Base.metadata.create_all(bind=engine); print('✅ Таблицы созданы')"

REM Создаем админ пользователя
echo 👤 Создание админ пользователя...
docker-compose exec -T backend python check_admin.py

echo.
echo ✅ Развертывание завершено!
echo.
echo 🌍 Frontend доступен по адресу: http://localhost
echo 🔌 Backend API доступен по адресу: http://localhost:8000
echo 📚 API документация: http://localhost:8000/docs
echo 🗄️ MySQL доступен на порту: 3306
echo.
echo 📱 Для тестирования с других устройств в локальной сети:
echo    - Узнайте IP вашего компьютера: ipconfig
echo    - Используйте http://ВАШ-IP для доступа с телефона
echo.
echo 🔍 Полезные команды:
echo   Просмотр логов: docker-compose logs -f
echo   Остановка: docker-compose down
echo   Перезапуск: docker-compose restart
echo   Логи MySQL: docker-compose logs mysql
echo   Подключение к MySQL: docker-compose exec mysql mysql -u valet_user -ppassword valet_service
echo.
pause 