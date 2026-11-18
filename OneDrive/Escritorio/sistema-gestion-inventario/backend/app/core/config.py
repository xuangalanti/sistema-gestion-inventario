from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "local"
    DATABASE_URL: str = "sqlite:///./inventario_local.db"
    USE_MOCK_DB: bool = True
    JWT_SECRET_KEY: str = "super_secret_key_for_dev_only_32_bytes_long"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
