import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SPECTRUM Intelligence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # ВАЖНО: Задаем дефолт, но он должен перекрыться из .env
    # Если .env не читается, вставь сюда свою строку PostgreSQL прямо тут!
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Kafedra@localhost:5432/postgres"

    SECRET_KEY: str = "super-secret-hackathon-key-change_me"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        # Указываем, что файл .env лежит на уровень выше или в текущей папке
        # Pydantic будет искать .env
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
