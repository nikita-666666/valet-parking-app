@echo off
echo ============================================
echo        Перезапуск Docker для мобильных
echo ============================================

echo [1/6] Остановка всех контейнеров...
docker-compose down

echo [2/6] Очистка кеша Docker...
docker system prune -f

echo [3/6] Пересборка и запуск контейнеров...
docker-compose up --build -d

echo [4/6] Ожидание запуска служб...
timeout /t 10 /nobreak

echo [5/6] Проверка статуса контейнеров...
docker-compose ps

echo [6/6] Получение информации о сети...
echo.
echo ВАШИ IP АДРЕСА:
ipconfig | findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*172\." /C:"IPv4.*10\."

echo.
echo ============================================
echo               ТЕСТИРОВАНИЕ
echo ============================================
echo.

for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\."') do (
    set IP=%%i
    set IP=!IP: =!
    if defined IP (
        echo С КОМПЬЮТЕРА: http://!IP!
        echo С ТЕЛЕФОНА:   http://!IP!/test-valet-mobile-auth.html
        echo API ENDPOINT: http://!IP!/api/v1/health
        echo.
        goto :found
    )
)

:found
echo ============================================
echo          ЛОГИ ДЛЯ ОТЛАДКИ
echo ============================================
echo.
echo Для просмотра логов backend:
echo docker-compose logs -f backend
echo.
echo Для просмотра логов frontend:
echo docker-compose logs -f frontend
echo.
echo ============================================

pause 