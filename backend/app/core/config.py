from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    PROJECT_NAME: str = "Talk Budget"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    POSTGRES_USER: str = "talkbudget"
    POSTGRES_PASSWORD: str = "talkbudget"
    POSTGRES_DB: str = "talkbudget"
    POSTGRES_HOST: str = "postgres-db"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_HOST: str = "redis-cache"
    REDIS_PORT: int = 6379

    # Security / JWT
    SECRET_KEY: str = "change-me-in-production-please-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Default admin seed
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_EMAIL: str = "admin@talkbudget.com"

    # AI Agent Gateway — supports two OpenAI-compatible providers: "opencode" and
    # "ollama". AI_PROVIDER picks the primary; the other is used as a fallback
    # if the primary is unconfigured or its request fails.
    AI_PROVIDER: str = "opencode"

    OPENCODE_API_KEY: str = ""
    OPENCODE_BASE_URL: str = "https://opencode.ai/zen/go/v1"
    OPENCODE_MODEL: str = "deepseek-v4-flash"

    OLLAMA_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "https://ollama.com/v1"
    OLLAMA_MODEL: str = "gemma4:31b-cloud"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
