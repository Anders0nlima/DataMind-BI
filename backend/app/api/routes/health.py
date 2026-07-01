"""Health-check route for liveness / readiness probes."""

from fastapi import APIRouter

router = APIRouter(tags=["infrastructure"])


@router.get(
    "/health",
    summary="Health Check",
    description="Returns service status. Used by load balancers, Docker HEALTHCHECK, and CI smoke tests.",
    response_model=dict,
)
async def health_check() -> dict:
    """Return a minimal liveness payload."""
    return {
        "status": "healthy",
        "service": "datamind-bi",
    }
