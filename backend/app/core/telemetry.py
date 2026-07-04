"""
Langfuse LLM Telemetry Module
──────────────────────────────
Provides observability for every LLM call in the DataMind BI pipeline.

Tracks:
  - Token usage (input / output / total)
  - Latency per generation
  - Model name and parameters
  - Cost estimation

Design: Uses Dependency Inversion — a lightweight wrapper that can
operate in "noop" mode when LANGFUSE_PUBLIC_KEY is not set, so the
app never crashes in dev/test environments without Langfuse credentials.
"""

from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ── Data Structures ──────────────────────────────────────────────────────

@dataclass
class GenerationTrace:
    """Immutable record of a single LLM generation event."""
    trace_id: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: float
    prompt_preview: str = ""
    output_preview: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


# ── Telemetry Client ─────────────────────────────────────────────────────

class LangfuseTelemetry:
    """
    Thin wrapper around the Langfuse Python SDK.

    If credentials are missing, every method degrades to a structured
    log line — zero exceptions, zero cloud dependency for local dev.

    Usage:
        telemetry = LangfuseTelemetry.from_env()

        with telemetry.trace("chat_query", user_id="u123") as t:
            # ... call LLM ...
            t.log_generation(
                model="gemini-2.5-flash",
                input_tokens=320,
                output_tokens=180,
                prompt_preview="Qual a média de salário?",
                output_preview="A média salarial é R$ 3.200,00.",
            )
    """

    def __init__(self, client: Any | None = None):
        self._client = client
        self._enabled = client is not None

    # ── Factory ──────────────────────────────────────────────────────

    @classmethod
    def from_env(cls) -> "LangfuseTelemetry":
        """
        Attempts to initialize Langfuse from environment variables:
          LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST

        Falls back to noop mode if any are missing or the SDK is
        not installed.
        """
        try:
            import os
            public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
            secret_key = os.getenv("LANGFUSE_SECRET_KEY")
            host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

            if not public_key or not secret_key:
                logger.info(
                    "Langfuse credentials not found. "
                    "Telemetry running in local-log mode."
                )
                return cls(client=None)

            from langfuse import Langfuse  # type: ignore[import-untyped]
            client = Langfuse(
                public_key=public_key,
                secret_key=secret_key,
                host=host,
            )
            logger.info("Langfuse telemetry initialized (host=%s)", host)
            return cls(client=client)

        except ImportError:
            logger.warning(
                "langfuse package not installed. "
                "Running in local-log mode. `pip install langfuse` to enable."
            )
            return cls(client=None)
        except Exception as exc:
            logger.error("Failed to init Langfuse: %s", exc)
            return cls(client=None)

    # ── Context Manager ──────────────────────────────────────────────

    def trace(self, name: str, user_id: str = "system") -> "TraceContext":
        """Opens a Langfuse trace span (or a local noop span)."""
        return TraceContext(
            telemetry=self,
            name=name,
            user_id=user_id,
        )


class TraceContext:
    """
    Context manager that wraps a single pipeline execution.

    Measures wall-clock latency automatically and flushes the
    generation record on __exit__.
    """

    def __init__(
        self,
        telemetry: LangfuseTelemetry,
        name: str,
        user_id: str,
    ):
        self._telemetry = telemetry
        self._name = name
        self._user_id = user_id
        self._start: float = 0.0
        self._trace: Any = None
        self._generations: list[GenerationTrace] = []

    def __enter__(self) -> "TraceContext":
        self._start = time.perf_counter()

        if self._telemetry._enabled:
            self._trace = self._telemetry._client.trace(
                name=self._name,
                user_id=self._user_id,
            )

        return self

    def log_generation(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        prompt_preview: str = "",
        output_preview: str = "",
        metadata: Optional[dict[str, Any]] = None,
    ) -> GenerationTrace:
        """Record a single LLM generation within this trace."""
        elapsed = (time.perf_counter() - self._start) * 1000

        record = GenerationTrace(
            trace_id=self._name,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            latency_ms=round(elapsed, 2),
            prompt_preview=prompt_preview[:200],
            output_preview=output_preview[:200],
            metadata=metadata or {},
        )
        self._generations.append(record)

        # ── Push to Langfuse if enabled ──────────────────────────────
        if self._telemetry._enabled and self._trace:
            self._trace.generation(
                name=f"{self._name}_gen",
                model=model,
                input=prompt_preview[:500],
                output=output_preview[:500],
                usage={
                    "input": input_tokens,
                    "output": output_tokens,
                    "total": input_tokens + output_tokens,
                },
                metadata=metadata or {},
            )

        # ── Always emit structured log ───────────────────────────────
        logger.info(
            "[Telemetry] model=%s tokens=%d/%d latency=%.1fms trace=%s",
            model,
            input_tokens,
            output_tokens,
            elapsed,
            self._name,
        )

        return record

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self._telemetry._enabled and self._telemetry._client:
            try:
                self._telemetry._client.flush()
            except Exception as exc:
                logger.warning("Langfuse flush failed: %s", exc)
