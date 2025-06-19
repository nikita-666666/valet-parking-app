from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api_router import api_router
from app.core.config import settings
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost",
        "http://localhost:80"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Добавляем middleware для логирования


# Подключаем роутер API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Корневой маршрут
@app.get("/")
async def root():
    return {
        "message": "Welcome to Valet Parking API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# Проверка здоровья системы
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