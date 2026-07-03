"""DataMind BI — LLM Provider Interface (Dependency Inversion).

Defines an abstract contract (LLMProvider) that the rest of the codebase
depends on. Concrete implementations (Gemini, Mock) are injected at runtime,
enabling:
- Offline development without spending cloud tokens.
- Deterministic test suites with predictable JSON outputs.
- Seamless provider swaps (e.g., Gemini -> Claude) without refactoring.
"""

from abc import ABC, abstractmethod
import json
import logging

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.models.domain_schemas import BIQueryResponse, DuckDBSchema, GeminiSQLPlan

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract interface for any Large Language Model provider.

    All AI interactions in DataMind BI go through this contract.
    The rest of the codebase never imports a specific SDK directly.
    """

    @abstractmethod
    async def generate_sql_plan(
        self, schema: DuckDBSchema, user_question: str
    ) -> GeminiSQLPlan:
        """Given a dataset schema and a user question, return a validated SQL plan.

        Args:
            schema: The lightweight DuckDB metadata (no raw data rows).
            user_question: The natural language question from the user.

        Returns:
            A Pydantic-validated GeminiSQLPlan with thought process,
            validity flag, and optional SQL query.
        """
        ...


class GeminiProvider(LLMProvider):
    """Production implementation using Google Gemini 2.5 Flash.

    Uses the google-genai SDK with structured output (response_mime_type)
    to force the LLM to return JSON that matches our Pydantic schema.
    Prompt construction is delegated to the prompt_factory module.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    async def generate_sql_plan(
        self, schema: DuckDBSchema, user_question: str
    ) -> GeminiSQLPlan:
        """Sends the schema + question to Gemini and parses the structured response."""
        from app.services.ai.prompt_factory import build_system_prompt, build_user_prompt

        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(schema, user_question)

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=GeminiSQLPlan,
                temperature=0.1,
            ),
        )

        raw_json = json.loads(response.text)
        return GeminiSQLPlan(**raw_json)

    async def generate_final_response(
        self, user_question: str, sql_results: list[dict], plan: GeminiSQLPlan
    ) -> BIQueryResponse:
        """Second pass: takes the exact math from DuckDB and generates human text."""
        
        # We enforce structured JSON output again
        system_prompt = (
            "You are a senior BI analyst. Your job is to narrate the results "
            "of a SQL query in human Portuguese (pt-BR). You are strictly forbidden "
            "from changing the numbers. Just present them elegantly."
        )
        user_prompt = (
            f"User Question: {user_question}\n"
            f"SQL Executed: {plan.sql_query}\n"
            f"Exact Results from Database: {sql_results}\n"
        )
        
        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=BIQueryResponse,
                temperature=0.1,
            ),
        )
        
        raw_json = json.loads(response.text)
        # Ensure sql_executed is set for transparency
        raw_json["sql_executed"] = plan.sql_query
        return BIQueryResponse(**raw_json)


class MockLLMProvider(LLMProvider):
    """Deterministic mock for offline testing and development."""

    def __init__(
        self, 
        plan_response: GeminiSQLPlan | None = None,
        final_response: BIQueryResponse | None = None
    ) -> None:
        self._plan_response = plan_response
        self._final_response = final_response

    async def generate_sql_plan(
        self, schema: DuckDBSchema, user_question: str
    ) -> GeminiSQLPlan:
        if self._plan_response is not None:
            return self._plan_response

        return GeminiSQLPlan(
            thought_process="Mock thought process.",
            is_methodologically_valid=True,
            pedagogical_correction=None,
            sql_query=f'SELECT COUNT(*) AS total FROM {schema.table_name}',
        )

    async def generate_final_response(
        self, user_question: str, sql_results: list[dict], plan: GeminiSQLPlan
    ) -> BIQueryResponse:
        
        if self._final_response is not None:
            return self._final_response
            
        return BIQueryResponse(
            narration=f"Mock narration for results: {sql_results}",
            visuals=[],
            sql_executed=plan.sql_query
        )
