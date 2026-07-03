"""DataMind BI — Methodological Guardrail Interception Middleware.

Implements a deterministic interception layer (Rule-Based AI) that evaluates
user prompts before they ever reach the LLM. By catching statistical 
violations early based on the dataset schema, we save API tokens, reduce 
latency, and prevent AI hallucinations.
"""

from app.models.domain_schemas import DuckDBSchema, VariableType


def intercept_methodological_errors(schema: DuckDBSchema, user_question: str) -> str | None:
    """Evaluates the user question against the dataset schema for statistical violations.
    
    Currently enforces:
    - Prohibition of arithmetic (mean, sum, median) on Qualitative Variables.
    
    Args:
        schema: The extracted metadata of the dataset.
        user_question: The natural language string from the user.
        
    Returns:
        A pedagogical correction string (pt-BR) if a violation is caught,
        or None if the question is cleared to proceed to the LLM.
    """
    question_lower = user_question.lower()
    
    # Detect intent for mathematical aggregation
    math_keywords = ["media", "média", "soma", "somar", "somatório", "mediana"]
    has_math_intent = any(kw in question_lower for kw in math_keywords)
    
    if has_math_intent:
        for col in schema.columns:
            # If the column is qualitative (Nominal or Ordinal)
            if col.variable_type in [
                VariableType.QUALITATIVE_NOMINAL, 
                VariableType.QUALITATIVE_ORDINAL
            ]:
                # And the user is specifically mentioning this column
                if col.name.lower() in question_lower:
                    tipo = "Nominal" if col.variable_type == VariableType.QUALITATIVE_NOMINAL else "Ordinal"
                    return (
                        f"Não é possível realizar operações aritméticas (como soma ou média) "
                        f"na coluna '{col.name}', pois ela é classificada estatisticamente "
                        f"como Qualitativa {tipo}. Variáveis qualitativas representam categorias "
                        f"ou rótulos, não grandezas matemáticas."
                    )
                    
    return None
