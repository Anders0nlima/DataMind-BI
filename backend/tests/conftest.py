"""Shared pytest fixtures for the DataMind BI test suite."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create a fresh FastAPI application for each test."""
    return create_app()


@pytest.fixture
async def client(app):
    """Async HTTP client wired to the test application.

    Uses ``httpx.AsyncClient`` with ``ASGITransport`` so requests
    go directly through the ASGI stack — no real network calls.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
