"""Tests for the health-check endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_200(client: AsyncClient):
    """GET /api/health should return 200 with a healthy status."""
    response = await client.get("/api/health")

    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "healthy"
    assert body["service"] == "datamind-bi"


@pytest.mark.asyncio
async def test_health_response_shape(client: AsyncClient):
    """Health payload must contain exactly the expected keys."""
    response = await client.get("/api/health")
    body = response.json()

    assert set(body.keys()) == {"status", "service"}


@pytest.mark.asyncio
async def test_openapi_schema_available(client: AsyncClient):
    """The auto-generated OpenAPI schema should be accessible."""
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "DataMind BI"
    assert "/api/health" in schema["paths"]
