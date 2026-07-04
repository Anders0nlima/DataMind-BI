# ─────────────────────────────────────────────────────────────
# DataMind BI — Backend Multi-Stage Dockerfile
# ─────────────────────────────────────────────────────────────
# Stage 1: Build  → installs deps in a venv (cached layer)
# Stage 2: Runtime → copies only the venv + app code (slim)
#
# Result: ~180 MB production image vs ~1.2 GB naive build
# ─────────────────────────────────────────────────────────────

# ── STAGE 1: Builder ────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /build

# OS-level build deps (some pip packages need gcc for C extensions)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy only the dependency manifest first (Docker cache optimization).
# If pyproject.toml hasn't changed, pip install is fully cached.
COPY pyproject.toml .

# Create a virtual environment inside the build stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install production dependencies only (no dev extras)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Now copy the application source code
COPY app/ app/


# ── STAGE 2: Runtime ────────────────────────────────────────
FROM python:3.13-slim AS runtime

# Security: run as non-root user
RUN groupadd --gid 1000 datamind && \
    useradd --uid 1000 --gid 1000 --create-home datamind

WORKDIR /app

# Copy the pre-built virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source
COPY --from=builder /build/app ./app
COPY pyproject.toml .

# ── Environment defaults (overridable at runtime) ───────────
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Expose the port Render/Cloud Run will route to
EXPOSE ${PORT}

# Switch to non-root user
USER datamind

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# ── Entrypoint ──────────────────────────────────────────────
# Uvicorn with sensible production defaults:
#   --workers 2       → concurrency for multi-core (keep low for DuckDB memory)
#   --host 0.0.0.0    → bind to all interfaces (required for Docker)
#   --limit-max-requests 1000 → graceful worker recycling
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--limit-max-requests", "1000", \
     "--access-log"]
