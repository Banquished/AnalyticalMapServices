from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AMS_", env_file=".env", extra="ignore")

    # Set AMS_CORS_ORIGINS as a comma-separated list for production deployments
    cors_origins: list[str] = ["http://localhost:5173"]
    cache_ttl_seconds: int = 3600
    cache_max_size: int = 500
    request_timeout_seconds: float = 15.0
    request_retries: int = 2


settings = Settings()
