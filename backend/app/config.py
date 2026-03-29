from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TaskSentinel"
    DATABASE_URL: str = "sqlite:///./data/tasksentinel.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Monitoring
    MONITOR_API_KEY: str = "change-me-monitor-key"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
