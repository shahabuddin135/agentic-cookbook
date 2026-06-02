from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    BETTER_AUTH_URL: str
    GEMINI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    LITELLM_MODEL: str = "groq/llama-3.3-70b-versatile"
    PEXELS_API_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    DEBUG: bool = False

    @property
    def parsed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
