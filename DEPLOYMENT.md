# Инструкция по развертыванию Valet Service

## Вариант 1: Railway (самый простой)

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Подключите ваш GitHub репозиторий
3. Railway автоматически обнаружит и развернет ваше приложение
4. Добавьте переменные окружения в Railway:
   - `DATABASE_URL` (Railway предоставит PostgreSQL автоматически)
   - `SECRET_KEY` = `your-super-secret-key-here`
   - `REACT_APP_API_URL` = `https://your-app-name.railway.app`

## Вариант 2: VPS с Docker (более гибкий)

### Требования к серверу:
- Ubuntu 20.04+ или CentOS 7+
- 2GB RAM минимум
- 20GB свободного места
- Docker и Docker Compose

### Шаги развертывания:

1. **Подготовка сервера:**
```bash
# Обновляем пакеты
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагружаемся для применения прав
sudo reboot
```

2. **Клонируем репозиторий:**
```bash
git clone https://github.com/your-username/valet-service.git
cd valet-service
```

3. **Настраиваем переменные окружения:**
```bash
# Редактируем docker-compose.yml
nano docker-compose.yml

# Замените:
# - your-server-ip на IP вашего сервера
# - your-secret-key-here на случайную строку
```

4. **Запускаем приложение:**
```bash
docker-compose up -d
```

5. **Инициализируем базу данных:**
```bash
# Ждем пока поднимется backend
sleep 30

# Запускаем миграции
docker-compose exec backend python -c "
from app.database import engine
from app.models.base import Base
Base.metadata.create_all(bind=engine)
"

# Создаем админ пользователя
docker-compose exec backend python backend/check_admin.py
```

## Вариант 3: Netlify + Heroku

### Frontend на Netlify:
1. Зарегистрируйтесь на [Netlify](https://netlify.com)
2. Подключите GitHub репозиторий
3. Настройте сборку:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
4. Добавьте переменную окружения:
   - `REACT_APP_API_URL` = ваш Heroku API URL

### Backend на Heroku:
1. Зарегистрируйтесь на [Heroku](https://heroku.com)
2. Создайте новое приложение
3. Добавьте PostgreSQL addon
4. Настройте переменные окружения в Heroku
5. Деплойте через Git

## Проверка работоспособности

После развертывания проверьте:

1. **Backend API:**
```bash
curl http://your-server-ip:8000/api/v1/health
# Должно вернуть: {"status": "ok"}
```

2. **Frontend:**
Откройте `http://your-server-ip` в браузере

3. **База данных:**
```bash
docker-compose exec postgres psql -U postgres -d valet_service -c "\dt"
# Должно показать список таблиц
```

## Настройка домена и SSL

### Для VPS с Nginx:
```bash
# Установка Certbot для SSL
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логи

```bash
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Статус сервисов
docker-compose ps

# Перезапуск сервисов
docker-compose restart backend
```

## Резервное копирование

```bash
# Создание бэкапа БД
docker-compose exec postgres pg_dump -U postgres valet_service > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U postgres valet_service < backup_20231201.sql
```

## Обновление приложения

```bash
# Остановка сервисов
docker-compose down

# Обновление кода
git pull origin main

# Пересборка и запуск
docker-compose up --build -d

# Применение миграций (если есть)
docker-compose exec backend alembic upgrade head
```

## Настройка для мобильных устройств

1. Убедитесь что сервер доступен по внешнему IP
2. Откройте порты 80 и 8000 в файрволе:
```bash
sudo ufw allow 80
sudo ufw allow 8000
sudo ufw enable
```

3. Для тестирования с телефона используйте IP адрес сервера:
   `http://YOUR-SERVER-IP`

## Troubleshooting

### Проблемы с CORS:
Убедитесь что в backend настроены правильные CORS origins

### База данных не подключается:
```bash
docker-compose logs postgres
docker-compose exec postgres pg_isready
```

### Frontend не загружается:
Проверьте что `REACT_APP_API_URL` указывает на правильный адрес backend

### Медленная работа:
- Увеличьте ресурсы сервера
- Настройте кэширование nginx
- Оптимизируйте запросы к БД 