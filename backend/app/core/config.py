"""Application settings.

All configuration is environment-driven (12-factor). Defaults are chosen so the
service runs out-of-the-box with **zero external dependencies** (SQLite, an
in-memory cache, and a deterministic mock LLM). Switch to Postgres + Redis +
a real LLM purely through environment variables — no code changes.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # ---- App -----------------------------------------------------------------
    PROJECT_NAME: str = "Resume Screener"
    API_V1_PREFIX: str = "/v1"
    ENV: Literal["dev", "prod", "test"] = "dev"
    # Create tables at startup. Handy for dev/SQLite; use Alembic migrations in prod.
    AUTO_CREATE_TABLES: bool = True
    CORS_ORIGINS: list[str] = ["*"]

    # ---- Database ------------------------------------------------------------
    # e.g. postgresql+psycopg2://user:pass@db:5432/resume_screener
    DATABASE_URL: str = "sqlite:///./resume_screener.db"

    # ---- Cache ---------------------------------------------------------------
    # If unset, an in-process dict cache is used instead of Redis.
    REDIS_URL: Optional[str] = None
    CACHE_TTL_SECONDS: int = 60 * 60

    # ---- Auth ----------------------------------------------------------------
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # ---- File storage --------------------------------------------------------
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".md"]

    # ---- LLM -----------------------------------------------------------------
    LLM_PROVIDER: Literal["mock", "anthropic", "openai"] = "mock"
    LLM_MAX_RETRIES: int = 2  # validation-failure retries for structured extraction

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-5"  # configurable; set to a model you have access to

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ---- Scoring -------------------------------------------------------------
    SIMILARITY_WEIGHT: float = 0.4  # weight of embedding cosine similarity
    LLM_WEIGHT: float = 0.6         # weight of LLM judgement score
    EMBEDDING_DIM: int = 512

    # ---- Derived helpers -----------------------------------------------------
    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def sqlalchemy_connect_args(self) -> dict:
        # SQLite needs this to be used across threads (FastAPI runs in a threadpool).
        return {"check_same_thread": False} if self.is_sqlite else {}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
