"""Tests for the LLM Provider interface (Dependency Inversion).

These tests prove that the entire AI pipeline can run deterministically
offline using the MockLLMProvider, without spending a single cloud token.
"""

import pytest

from app.services.ai.provider import LLMProvider, MockLLMProvider
from app.models.domain_schemas import (
    DuckDBSchema,
    ColumnSchema,
    VariableType,
    GeminiSQLPlan,
)


@pytest.fixture
def sample_schema() -> DuckDBSchema:
    """A minimal DuckDB schema fixture for testing prompts."""
    return DuckDBSchema(
        table_name="sales",
        total_rows=5000,
        columns=[
            ColumnSchema(
                name="product",
                sql_type="VARCHAR",
                variable_type=VariableType.QUALITATIVE_NOMINAL,
                sample_values=["Apple", "Banana", "Cherry"],
            ),
            ColumnSchema(
                name="revenue",
                sql_type="DOUBLE",
                variable_type=VariableType.QUANTITATIVE_CONTINUOUS,
                sample_values=[150.50, 200.75, 99.00],
            ),
            ColumnSchema(
                name="quantity",
                sql_type="INTEGER",
                variable_type=VariableType.QUANTITATIVE_DISCRETE,
                sample_values=[10, 25, 5],
            ),
        ],
    )


@pytest.mark.asyncio
async def test_mock_provider_is_an_llm_provider():
    """Proves the MockLLMProvider satisfies the abstract LLMProvider contract."""
    mock = MockLLMProvider()
    assert isinstance(mock, LLMProvider)


@pytest.mark.asyncio
async def test_mock_provider_returns_default_sql_plan(sample_schema):
    """The default mock should return a valid GeminiSQLPlan with a COUNT query."""
    mock = MockLLMProvider()
    plan = await mock.generate_sql_plan(sample_schema, "How many sales do we have?")

    assert isinstance(plan, GeminiSQLPlan)
    assert plan.is_methodologically_valid is True
    assert plan.sql_query is not None
    assert "COUNT" in plan.sql_query
    assert "sales" in plan.sql_query
    assert plan.pedagogical_correction is None


@pytest.mark.asyncio
async def test_mock_provider_returns_custom_response(sample_schema):
    """A pre-configured mock should return the exact response it was given."""
    custom = GeminiSQLPlan(
        thought_process="Testing custom response path.",
        is_methodologically_valid=False,
        pedagogical_correction="You cannot calculate the mean of a nominal variable.",
        sql_query=None,
    )
    mock = MockLLMProvider(response=custom)
    plan = await mock.generate_sql_plan(sample_schema, "What is the average product?")

    assert plan.is_methodologically_valid is False
    assert plan.sql_query is None
    assert "nominal" in plan.pedagogical_correction


@pytest.mark.asyncio
async def test_mock_provider_thought_process_includes_context(sample_schema):
    """The default mock should reference the user question and schema in its thought process."""
    mock = MockLLMProvider()
    question = "Show me the total revenue"
    plan = await mock.generate_sql_plan(sample_schema, question)

    assert question in plan.thought_process
    assert sample_schema.table_name in plan.thought_process
    assert str(sample_schema.total_rows) in plan.thought_process
