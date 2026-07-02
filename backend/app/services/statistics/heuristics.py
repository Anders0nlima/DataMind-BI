"""DataMind BI — Official IBGE/UFPA Statistical Heuristics.

This module codifies the exact rules extracted from the academic literature,
ensuring mathematical integrity and methodological correctness before the data
reaches the LLM or the frontend.
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

from app.models.domain_schemas import VariableType


def ibge_round(value: float | str | Decimal, ndigits: int = 0) -> float | int:
    """Applies the official 1993 IBGE Tabular Presentation Norms for rounding (Cap 5.7).
    
    Rule:
    - If the first digit to be discarded is <= 4, the preceding digit remains unchanged.
    - If the first digit to be discarded is >= 5, add 1 to the preceding digit.
    
    Crucial Rule: Successive rounding is strictly forbidden. We must round directly 
    from the original precision to the target precision.
    
    Python's default `round()` uses "Banker's Rounding" (ROUND_HALF_EVEN), which 
    violates IBGE norms (e.g., Python `round(2.5)` -> 2, IBGE expects 3). 
    We enforce `ROUND_HALF_UP` via the `decimal` library.
    
    Args:
        value: The number to round.
        ndigits: The target number of decimal places.
        
    Returns:
        The strictly rounded number (int if ndigits=0, else float).
    """
    try:
        # Convert to string first to avoid floating point precision artifacts
        # e.g. 2.675 resolving to 2.6749999999999998 in memory.
        if isinstance(value, float):
            d_val = Decimal(str(value))
        else:
            d_val = Decimal(value)
            
        # Determine the quantization exponent
        exp = Decimal('1.' + '0' * ndigits) if ndigits > 0 else Decimal('1')
        
        # Quantize using ROUND_HALF_UP (IBGE standard)
        rounded = d_val.quantize(exp, rounding=ROUND_HALF_UP)
        
        return int(rounded) if ndigits == 0 else float(rounded)
        
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"Cannot apply IBGE rounding to value: {value}")


def infer_variable_type(column_name: str, sql_type: str, sample_values: list = None) -> VariableType:
    """Auto-classifies a dataset column into a statistical variable type (Cap 1.15).
    
    This function analyzes the column name and DuckDB SQL type to deduce 
    if the variable is Nominal, Ordinal, Discrete, or Continuous.
    """
    sql_type = sql_type.upper()
    col_lower = column_name.lower()
    
    # 1. Identifiers are ALWAYS Nominal, even if stored as INTEGERS
    nominal_exact = {"id", "cep", "cpf", "cnpj"}
    nominal_substrings = {"code", "codigo", "código", "phone", "telefone"}
    
    if col_lower in nominal_exact or col_lower.endswith("_id") or col_lower.startswith("id_"):
        return VariableType.QUALITATIVE_NOMINAL
        
    if any(keyword in col_lower for keyword in nominal_substrings):
        return VariableType.QUALITATIVE_NOMINAL

    # 2. Ordinals infer rank, level, or ordered categories
    ordinal_keywords = {"rank", "level", "nivel", "nível", "rating", "size", "tamanho", "class", "classe", "tier"}
    if any(keyword in col_lower for keyword in ordinal_keywords):
        return VariableType.QUALITATIVE_ORDINAL

    # 3. Pure Numeric Types
    if any(t in sql_type for t in ("INT", "LONG")):
        return VariableType.QUANTITATIVE_DISCRETE
        
    if any(t in sql_type for t in ("DOUBLE", "FLOAT", "DECIMAL", "REAL", "NUMERIC")):
        return VariableType.QUANTITATIVE_CONTINUOUS

    # 4. Fallback for strings, booleans, and dates
    return VariableType.QUALITATIVE_NOMINAL
