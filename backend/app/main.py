from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api_router import api_router
from app.core.config import settings
from app.middleware.logging import RequestLoggingMiddleware
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Настройка CORS - используем паттерны для локальных сетей
import re

def is_local_network_origin(origin: str) -> bool:
    """Проверяет, является ли origin локальным адресом"""
    local_patterns = [
        r'^https?://localhost(:\d+)?$',
        r'^https?://127\.0\.0\.1(:\d+)?$',
        r'^https?://192\.168\.\d+\.\d+(:\d+)?$',  # 192.168.x.x
        r'^https?://172\.\d+\.\d+\.\d+(:\d+)?$',  # 172.x.x.x (Docker)
        r'^https?://10\.\d+\.\d+\.\d+(:\d+)?$',   # 10.x.x.x
    ]
    return any(re.match(pattern, origin) for pattern in local_patterns)

# Базовые origins для разработки
origins = [
    "http://localhost:3000",    # React dev
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # Vite dev
    "http://127.0.0.1:5173",
    "http://localhost",         # Production frontend
    "http://127.0.0.1",
    "http://localhost:80",
    "http://127.0.0.1:80",
]

# Добавляем middleware для логирования (должно быть первым)
app.add_middleware(RequestLoggingMiddleware)

# Кастомная функция для проверки origin
def custom_origin_check(origin: str) -> bool:
    """Проверяет разрешен ли origin"""
    if origin in origins:
        return True
    return is_local_network_origin(origin)

# Используем allow_origin_regex для поддержки локальных IP и Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|.*\.railway\.app|.*\.up\.railway\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],        # Разрешаем все методы
    allow_headers=["*"],        # Разрешаем все заголовки
    expose_headers=["*"],       # Разрешаем доступ ко всем заголовкам
)

# Подключаем роутеры
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Hello World"} 

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "API is working",
        "cors_enabled": True,
        "api_version": "v1"
    }

# Обслуживание статических файлов React (для Railway)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static/static"), name="static")
    app.mount("/", StaticFiles(directory="static", html=True), name="frontend") 