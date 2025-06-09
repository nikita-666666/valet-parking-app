@echo off
echo =================================
echo  Перезапуск Valet Mobile Docker
echo =================================

echo.
echo Остановка контейнеров...
docker-compose down

echo.
echo Пересборка frontend контейнера...
docker-compose build frontend

echo.
echo Запуск всех контейнеров...
docker-compose up -d

echo.
echo Проверка статуса...
docker-compose ps

echo.
echo =================================
echo Готово! Приложение доступно на:
echo - Фронтенд: http://localhost/valet-mobile
echo - API: http://localhost/api/v1
echo - Тест: http://localhost/test-valet-mobile-auth.html
echo =================================

echo.
echo Логи можно посмотреть командой:
echo docker-compose logs -f

pause 