# 🖥️ Развертывание Valet Parking System на VPS

## 📋 **Требования к серверу**

- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: минимум 2GB (рекомендуется 4GB)
- **Диск**: минимум 20GB свободного места
- **CPU**: 1+ ядер

## 🚀 **Быстрая установка**

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка Git
sudo apt install git -y

# Перезагрузка для применения прав Docker
sudo reboot
```

### 2. Загрузка проекта

```bash
# Клонирование репозитория
git clone https://github.com/nikita-666666/valet-parking-app.git
cd valet-parking-app

# Делаем скрипт исполняемым
chmod +x deploy-vps.sh
```

### 3. Настройка переменных окружения

```bash
# Отредактируйте docker-compose.prod.yml
nano docker-compose.prod.yml

# Измените следующие параметры:
# - MYSQL_PASSWORD (пароль для БД)
# - MYSQL_ROOT_PASSWORD (root пароль)
# - SECRET_KEY (секретный ключ для JWT)
```

### 4. Развертывание

```bash
# Запуск автоматического развертывания
./deploy-vps.sh
```

## 🔧 **Ручная настройка**

### Если нужна ручная установка:

```bash
# Сборка образов
docker-compose -f docker-compose.prod.yml build

# Запуск контейнеров
docker-compose -f docker-compose.prod.yml up -d

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

## 🌐 **Настройка домена (опционально)**

### Если у вас есть домен:

1. **Настройте DNS записи**:
   - A запись: `yourdomain.com` → `IP_вашего_сервера`

2. **Измените nginx.conf**:
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

3. **Установите SSL сертификат**:
   ```bash
   # Установка Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Получение сертификата
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## 🔒 **Безопасность**

### Рекомендуемые настройки:

1. **Firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

2. **Смена паролей**:
   - Измените пароли MySQL в docker-compose.prod.yml
   - Сгенерируйте новый SECRET_KEY

3. **Регулярные обновления**:
   ```bash
   # Обновление кода
   git pull origin main
   ./deploy-vps.sh
   ```

## 📱 **Тестирование**

После развертывания проверьте:

- ✅ **Frontend**: `http://your-server-ip`
- ✅ **API**: `http://your-server-ip/docs`
- ✅ **Health**: `http://your-server-ip/health`

### Тестовые данные:
- **Email**: `valet@test.com`
- **Password**: `valet123`

## 🐛 **Решение проблем**

### Основные команды диагностики:

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи всех сервисов
docker-compose -f docker-compose.prod.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs mysql
docker-compose -f docker-compose.prod.yml logs nginx

# Перезапуск сервиса
docker-compose -f docker-compose.prod.yml restart backend

# Полная пересборка
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Частые проблемы:

1. **"Connection refused"**:
   - Проверьте что все контейнеры запущены
   - Убедитесь что порты не заняты другими процессами

2. **"Database connection failed"**:
   - Дождитесь полного запуска MySQL (30-60 секунд)
   - Проверьте пароли в docker-compose.prod.yml

3. **"Permission denied"**:
   - Проверьте права на директории: `sudo chown -R $USER:$USER .`

## 📊 **Мониторинг**

### Полезные команды:

```bash
# Использование ресурсов
docker stats

# Место на диске
df -h
docker system df

# Очистка старых образов
docker system prune -a
```

## 🔄 **Обновление**

```bash
# Обновление кода
git pull origin main

# Пересборка и перезапуск
./deploy-vps.sh
```

---

**🎉 Готово!** Ваше приложение Valet Parking System успешно развернуто на VPS! 