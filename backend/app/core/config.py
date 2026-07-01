"""DataMind BI — Core application settings.

Centralizes all configuration via environment variables using pydantic-settings.
Every tunable knob in the system reads from this single source of truth.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables or `.env` file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────
    app_name: str = "DataMind BI"
    app_version: str = "0.1.0"
    debug: bool = False

    # ── Server ───────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── CORS ─────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:5173"]

    # ── AI / Gemini ──────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # ── Langfuse ─────────────────────────────────────────────────────────
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"

    # ── Upload Limits ────────────────────────────────────────────────────
    max_upload_size_mb: int = 100


def get_settings() -> Settings:
    """Factory that returns a cached Settings instance.

    Using a plain function (instead of ``lru_cache``) keeps the door open
    for dependency-injection overrides in tests.
    """
    return Settings()
