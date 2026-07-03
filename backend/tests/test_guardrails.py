"""Tests for the Methodological Guardrail Interception Middleware."""

from app.services.ai.guardrails import intercept_methodological_errors
from app.models.domain_schemas import DuckDBSchema, ColumnSchema, VariableType


def test_guardrail_intercepts_mean_of_nominal():
    """Proves the middleware blocks arithmetic on qualitative nominal variables."""
    schema = DuckDBSchema(
        table_name="sales",
        total_rows=10,
        columns=[
            ColumnSchema(
                name="cidade", 
                sql_type="VARCHAR", 
                variable_type=VariableType.QUALITATIVE_NOMINAL, 
                sample_values=["Belém"]
            )
        ]
    )
    
    question = "Qual a média de cidade?"
    correction = intercept_methodological_errors(schema, question)
    
    assert correction is not None
    assert "Não é possível realizar operações aritméticas" in correction
    assert "'cidade'" in correction
    assert "Qualitativa Nominal" in correction


def test_guardrail_allows_mean_of_continuous():
    """Proves the middleware allows valid arithmetic on quantitative variables."""
    schema = DuckDBSchema(
        table_name="sales",
        total_rows=10,
        columns=[
            ColumnSchema(
                name="faturamento", 
                sql_type="DOUBLE", 
                variable_type=VariableType.QUANTITATIVE_CONTINUOUS, 
                sample_values=[150.5]
            )
        ]
    )
    
    question = "Qual a média de faturamento?"
    correction = intercept_methodological_errors(schema, question)
    
    # Should not intercept
    assert correction is None


def test_guardrail_allows_non_math_questions_on_nominal():
    """Proves the middleware allows valid counting/grouping on nominal variables."""
    schema = DuckDBSchema(
        table_name="sales",
        total_rows=10,
        columns=[
            ColumnSchema(
                name="cidade", 
                sql_type="VARCHAR", 
                variable_type=VariableType.QUALITATIVE_NOMINAL, 
                sample_values=["Belém"]
            )
        ]
    )
    
    question = "Quantas vendas tivemos por cidade?"
    correction = intercept_methodological_errors(schema, question)
    
    # "Quantas" is count, not mean/sum, so it's valid for nominal.
    assert correction is None
