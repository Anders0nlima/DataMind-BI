"""DataMind BI — FastAPI application entry point.

Bootstraps the ASGI application with:
- Lifespan context manager for startup/shutdown hooks.
- CORS middleware configured from centralized settings.
- All route modules mounted under versioned prefixes.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown hooks.

    Future commits will initialize DuckDB session pools and
    Langfuse telemetry clients here.
    """
    settings = get_settings()
    logger.info(
        "Starting %s v%s (debug=%s)",
        settings.app_name,
        settings.app_version,
        settings.debug,
    )
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    """Application factory.

    Returns a fully configured FastAPI instance. Using a factory
    enables clean test isolation — each test can call ``create_app()``
    with overridden settings.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Business Intelligence platform with guided statistics "
            "and conversational AI powered by Gemini."
        ),
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routes ───────────────────────────────────────────────────────
    app.include_router(health.router, prefix="/api")

    return app


app = create_app()
