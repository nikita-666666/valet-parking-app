# backend/app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Valet Service"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 часов
    
    MYSQL_USER: str = "u2385522_pp_db"
    MYSQL_PASSWORD: str = "aF2fN9rV7fbP8mG5"
    MYSQL_HOST: str = "89.17.33.190"
    MYSQL_PORT: str = "3313"
    MYSQL_DB: str = "u2385522_pp_database"

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        # Используем pymysql драйвер для MySQL 8
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}?charset=utf8mb4"

    class Config:
        env_file = ".env"

settings = Settings() 