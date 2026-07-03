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
from app.models.domain_schemas import DuckDBSchema, GeminiSQLPlan

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
    """

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    async def generate_sql_plan(
        self, schema: DuckDBSchema, user_question: str
    ) -> GeminiSQLPlan:
        """Sends the schema + question to Gemini and parses the structured response."""
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(schema, user_question)

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

    @staticmethod
    def _build_system_prompt() -> str:
        """Returns the system-level instructions that constrain Gemini's behavior."""
        return (
            "You are a senior BI analyst embedded in the DataMind BI platform. "
            "You follow the UFPA/IBGE statistical methodology strictly.\n\n"
            "RULES:\n"
            "1. You MUST generate DuckDB-compatible SQL.\n"
            "2. You MUST NOT perform mathematical calculations yourself — "
            "delegate ALL math to SQL aggregate functions.\n"
            "3. If the user asks for a statistically invalid operation "
            "(e.g., mean of a nominal variable), set is_methodologically_valid=false "
            "and explain the correction in pedagogical_correction.\n"
            "4. Always explain your reasoning step-by-step in thought_process.\n"
            "5. Return valid JSON matching the GeminiSQLPlan schema."
        )

    @staticmethod
    def _build_user_prompt(schema: DuckDBSchema, user_question: str) -> str:
        """Formats the dataset schema and user question into the LLM prompt."""
        columns_desc = "\n".join(
            f"  - {col.name} ({col.sql_type}, {col.variable_type.value}): "
            f"samples = {col.sample_values}"
            for col in schema.columns
        )
        return (
            f"## Dataset: `{schema.table_name}`\n"
            f"Total rows: {schema.total_rows}\n"
            f"Columns:\n{columns_desc}\n\n"
            f"## User Question\n"
            f'"{user_question}"'
        )


class MockLLMProvider(LLMProvider):
    """Deterministic mock for offline testing and development.

    Returns pre-configured GeminiSQLPlan responses without making
    any network calls or consuming API tokens.
    """

    def __init__(self, response: GeminiSQLPlan | None = None) -> None:
        """Initialize with an optional pre-configured response.

        Args:
            response: A fixed GeminiSQLPlan to return. If None, a sensible
                      default valid response is generated automatically.
        """
        self._response = response

    async def generate_sql_plan(
        self, schema: DuckDBSchema, user_question: str
    ) -> GeminiSQLPlan:
        """Returns the pre-configured mock response instantly."""
        if self._response is not None:
            return self._response

        # Default: generate a basic COUNT(*) query
        return GeminiSQLPlan(
            thought_process=(
                f"The user asked: '{user_question}'. "
                f"The table '{schema.table_name}' has {schema.total_rows} rows. "
                "I will generate a simple count query as a default mock response."
            ),
            is_methodologically_valid=True,
            pedagogical_correction=None,
            sql_query=f'SELECT COUNT(*) AS total FROM {schema.table_name}',
        )
