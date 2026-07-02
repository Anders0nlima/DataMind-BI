"""Tests for the official IBGE statistical heuristics."""

import pytest

from app.services.statistics.heuristics import ibge_round, infer_variable_type
from app.models.domain_schemas import VariableType


def test_ibge_rounding_basic():
    """Validates simple rounding cases following IBGE >= 5 rule."""
    # Round down (<= 4)
    assert ibge_round(16.4, 0) == 16
    assert ibge_round(17.34, 1) == 17.3
    
    # Round up (>= 5)
    assert ibge_round(16.5, 0) == 17
    assert ibge_round(16.504, 0) == 17
    assert ibge_round(17.578, 2) == 17.58


def test_ibge_rounding_prevents_successive_rounding():
    """Validates the strict prohibition of successive rounding.
    
    Example from textbook: 17.3452 rounded to 1 decimal place.
    - Incorrect (successive): 17.3452 -> 17.35 -> 17.4
    - Correct (IBGE direct): 17.3452 -> 17.3
    """
    assert ibge_round(17.3452, 1) == 17.3


def test_ibge_rounding_differs_from_python_default():
    """Proves that standard Python 'Banker's Rounding' is overridden.
    
    Python round(2.5) -> 2 (rounds to nearest even).
    IBGE round(2.5) -> 3 (rounds up since digit is >= 5).
    """
    assert round(2.5) == 2  # Python default behavior
    assert ibge_round(2.5, 0) == 3  # IBGE compliance


def test_variable_typification_nominal_identifiers():
    """Ensures identifiers like IDs, Codes, and Zips are marked Nominal."""
    assert infer_variable_type("product_id", "INTEGER") == VariableType.QUALITATIVE_NOMINAL
    assert infer_variable_type("CÓDIGO", "BIGINT") == VariableType.QUALITATIVE_NOMINAL
    assert infer_variable_type("telefone", "VARCHAR") == VariableType.QUALITATIVE_NOMINAL


def test_variable_typification_ordinals():
    """Ensures ordered categories are marked Ordinal."""
    assert infer_variable_type("Customer_Rating", "VARCHAR") == VariableType.QUALITATIVE_ORDINAL
    assert infer_variable_type("nivel_de_risco", "VARCHAR") == VariableType.QUALITATIVE_ORDINAL


def test_variable_typification_numeric():
    """Ensures pure numerics fall into Discrete (Int) or Continuous (Float)."""
    assert infer_variable_type("quantidade", "INTEGER") == VariableType.QUANTITATIVE_DISCRETE
    assert infer_variable_type("faturamento", "DOUBLE") == VariableType.QUANTITATIVE_CONTINUOUS
    assert infer_variable_type("peso_kg", "DECIMAL(10,2)") == VariableType.QUANTITATIVE_CONTINUOUS
