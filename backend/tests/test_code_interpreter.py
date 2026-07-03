"""Tests for the Code Interpreter Pipeline."""

import pytest
import tempfile
import duckdb

from app.services.ai.code_interpreter import CodeInterpreter
from app.services.ai.provider import MockLLMProvider
from app.models.domain_schemas import (
    DuckDBSchema, 
    ColumnSchema, 
    VariableType, 
    GeminiSQLPlan, 
    BIQueryResponse
)


@pytest.fixture
def sample_db(tmp_path):
    """Creates a temporary DuckDB database with some sample data."""
    db_path = str(tmp_path / "test.duckdb")
    with duckdb.connect(db_path) as conn:
        conn.execute("CREATE TABLE sales (product VARCHAR, revenue DOUBLE)")
        conn.execute("INSERT INTO sales VALUES ('Apple', 150.5), ('Banana', 200.0), ('Apple', 50.0)")
    yield db_path


@pytest.fixture
def sample_schema():
    """Schema matching the sample_db."""
    return DuckDBSchema(
        table_name="sales",
        total_rows=3,
        columns=[
            ColumnSchema(name="product", sql_type="VARCHAR", variable_type=VariableType.QUALITATIVE_NOMINAL, sample_values=["Apple"]),
            ColumnSchema(name="revenue", sql_type="DOUBLE", variable_type=VariableType.QUANTITATIVE_CONTINUOUS, sample_values=[150.5]),
        ]
    )


@pytest.mark.asyncio
async def test_interpreter_successful_pipeline(sample_db, sample_schema):
    """Proves the two-pass pipeline works when the SQL is valid."""
    # Pass 1 mock: valid SQL
    mock_plan = GeminiSQLPlan(
        thought_process="Group by product.",
        is_methodologically_valid=True,
        pedagogical_correction=None,
        sql_query="SELECT product, SUM(revenue) as total FROM sales GROUP BY product ORDER BY product"
    )
    # Pass 2 mock: final response
    mock_final = BIQueryResponse(
        narration="A receita total para Apple foi 200.5 e Banana 200.0.",
        visuals=[],
        sql_executed=mock_plan.sql_query
    )
    
    provider = MockLLMProvider(plan_response=mock_plan, final_response=mock_final)
    interpreter = CodeInterpreter(provider)
    
    response = await interpreter.answer_question(sample_db, sample_schema, "What is the revenue by product?")
    
    assert response.narration == mock_final.narration
    assert response.sql_executed == mock_plan.sql_query


@pytest.mark.asyncio
async def test_interpreter_invalid_statistical_request(sample_db, sample_schema):
    """Proves the pipeline short-circuits if the LLM marks the request as methodologically invalid."""
    mock_plan = GeminiSQLPlan(
        thought_process="User asked for mean of a nominal variable.",
        is_methodologically_valid=False,
        pedagogical_correction="Não é possível calcular a média de uma variável qualitativa nominal.",
        sql_query=None
    )
    
    provider = MockLLMProvider(plan_response=mock_plan)
    interpreter = CodeInterpreter(provider)
    
    response = await interpreter.answer_question(sample_db, sample_schema, "What is the average product?")
    
    # Should short-circuit and return the pedagogical correction directly
    assert response.narration == mock_plan.pedagogical_correction
    assert response.sql_executed is None


@pytest.mark.asyncio
async def test_interpreter_sql_execution_failure(sample_db, sample_schema):
    """Proves the pipeline catches DuckDB SQL errors gracefully."""
    mock_plan = GeminiSQLPlan(
        thought_process="I made a typo.",
        is_methodologically_valid=True,
        pedagogical_correction=None,
        sql_query="SELECT nonexistent_column FROM sales"
    )
    
    provider = MockLLMProvider(plan_response=mock_plan)
    interpreter = CodeInterpreter(provider)
    
    response = await interpreter.answer_question(sample_db, sample_schema, "Show me non-existent data.")
    
    assert "ocorreu um erro ao executar a consulta" in response.narration
    assert "nonexistent_column" in response.narration
    assert response.sql_executed == mock_plan.sql_query
