@echo off
echo Rebuilding with debug info...

docker-compose stop frontend
docker image rm get_wallet-frontend --force 2>nul
docker-compose build --no-cache frontend
docker-compose start frontend

echo Waiting...
timeout /t 10 /nobreak >nul

echo Done! Check mobile app with browser console:
echo http://192.168.251.30/valet-mobile
echo Login: valet@test.com / valet123
echo Open browser dev tools (F12) to see console logs
pause 