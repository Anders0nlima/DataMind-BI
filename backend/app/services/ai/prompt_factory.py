"""DataMind BI — Prompt Factory with Schema Injection and Smart Charting Guardrails.

This module constructs the dynamic prompts that constrain Gemini's behavior.
Instead of a static instruction, prompts are assembled at runtime by injecting:
1. The DuckDB schema (column names, types, and samples — never raw data).
2. The UFPA/IBGE statistical rulebook (variable typification + chart restrictions).
3. Smart Charting guardrails (which chart types are allowed for which variable types).

The prompts encode the "Code Interpreter" pattern: the AI must generate SQL,
never attempt its own math.
"""

from app.models.domain_schemas import DuckDBSchema, VariableType


# ── Smart Charting Rules (RF13 — UFPA Chapter 1.15) ─────────────────
# Maps each VariableType to the chart types that are statistically valid.

CHART_RULES: dict[VariableType, dict] = {
    VariableType.QUALITATIVE_NOMINAL: {
        "allowed": ["COLUMN", "HORIZONTAL_BAR", "PIE"],
        "forbidden": ["LINE"],
        "reason": "Nominal variables have no inherent order. Line charts imply continuity and trend, which is misleading.",
    },
    VariableType.QUALITATIVE_ORDINAL: {
        "allowed": ["COLUMN", "HORIZONTAL_BAR"],
        "forbidden": ["LINE", "PIE"],
        "reason": "Ordinal variables have order but unequal intervals. Pie charts hide ranking; line charts exaggerate continuity.",
    },
    VariableType.QUANTITATIVE_DISCRETE: {
        "allowed": ["COLUMN", "HORIZONTAL_BAR", "LINE"],
        "forbidden": ["PIE"],
        "reason": "Discrete counts are best shown as bars or points. Pie charts poorly represent counted magnitudes.",
    },
    VariableType.QUANTITATIVE_CONTINUOUS: {
        "allowed": ["LINE", "COLUMN"],
        "forbidden": ["PIE", "HORIZONTAL_BAR"],
        "reason": "Continuous data demands axes that show scale. Pie and horizontal bars distort continuous distributions.",
    },
}


def build_system_prompt() -> str:
    """Constructs the system-level instruction that defines Gemini's persona and rules.

    This prompt is injected as the `system_instruction` parameter in the
    Gemini API call, establishing the AI's identity and non-negotiable constraints.
    """
    return (
        "You are a senior Business Intelligence analyst embedded in the DataMind BI platform. "
        "You follow the UFPA/IBGE statistical methodology with absolute strictness.\n\n"
        "# CORE RULES\n"
        "1. You MUST generate DuckDB-compatible SQL to answer any analytical question.\n"
        "2. You MUST NOT perform mathematical calculations yourself — "
        "delegate ALL math to SQL aggregate functions (SUM, AVG, COUNT, etc.).\n"
        "3. Your response MUST be valid JSON matching the GeminiSQLPlan schema.\n"
        "4. Always explain your reasoning step-by-step in the `thought_process` field.\n\n"
        "# STATISTICAL VALIDATION RULES\n"
        "5. If the user asks for a statistically invalid operation "
        "(e.g., mean of a nominal variable, median of categories), "
        "set `is_methodologically_valid` to false.\n"
        "6. When invalid, provide a clear pedagogical explanation in `pedagogical_correction`, "
        "citing the specific UFPA/IBGE rule being violated.\n"
        "7. When invalid, set `sql_query` to null — do NOT generate a query for an invalid request.\n\n"
        "# IBGE TABULAR NORMS\n"
        "8. Tables must NEVER have vertical borders.\n"
        "9. All frequency tables must include: class intervals, absolute frequency (fi), "
        "relative frequency (fr%), cumulative frequency (Fi), and cumulative relative frequency (Fr%).\n"
        "10. All numerical results must be rounded using the IBGE 1993 rounding standard "
        "(>= 5 rounds up; successive rounding is forbidden).\n\n"
        "# RESPONSE LANGUAGE\n"
        "11. The `thought_process` field should be in English.\n"
        "12. The `pedagogical_correction` field should be in Portuguese (pt-BR), "
        "since it will be displayed directly to the end user.\n"
    )


def build_user_prompt(schema: DuckDBSchema, user_question: str) -> str:
    """Constructs the user-level prompt by injecting the dataset schema and chart rules.

    This prompt dynamically adapts to whatever dataset the user uploaded,
    teaching Gemini the exact column names, types, and statistical classifications
    so it can generate precise SQL without ever seeing raw data.

    Args:
        schema: The lightweight DuckDB metadata extracted by the ingestion engine.
        user_question: The natural language question from the end user.

    Returns:
        A fully formatted prompt string ready for the Gemini API.
    """
    # ── Section 1: Dataset Schema Injection ──────────────────────────
    columns_block = _format_columns(schema)

    # ── Section 2: Smart Charting Guardrails ──────────────────────────
    charting_block = _format_chart_rules(schema)

    return (
        f"## Dataset Information\n"
        f"- **Table name:** `{schema.table_name}`\n"
        f"- **Total rows:** {schema.total_rows:,}\n\n"
        f"### Column Definitions\n"
        f"{columns_block}\n\n"
        f"### Smart Charting Rules (MUST follow)\n"
        f"{charting_block}\n\n"
        f"## User Question\n"
        f'"{user_question}"\n\n'
        f"Generate a GeminiSQLPlan JSON response."
    )


def _format_columns(schema: DuckDBSchema) -> str:
    """Formats column metadata into a structured block for the prompt."""
    lines = []
    for col in schema.columns:
        samples_str = ", ".join(str(s) for s in col.sample_values)
        lines.append(
            f"| `{col.name}` | {col.sql_type} | {col.variable_type.value} | [{samples_str}] |"
        )

    header = "| Column | SQL Type | Statistical Type | Sample Values |"
    separator = "|--------|----------|------------------|---------------|"

    return f"{header}\n{separator}\n" + "\n".join(lines)


def _format_chart_rules(schema: DuckDBSchema) -> str:
    """Generates personalized chart restrictions based on the actual columns uploaded.

    Instead of dumping a generic rulebook, this function inspects the specific
    variable types present in the dataset and only includes relevant rules.
    """
    # Collect unique variable types in this dataset
    present_types = {col.variable_type for col in schema.columns}

    lines = []
    for var_type in present_types:
        rule = CHART_RULES[var_type]
        allowed = ", ".join(rule["allowed"])
        forbidden = ", ".join(rule["forbidden"])
        lines.append(
            f"- **{var_type.value}** columns → "
            f"Allowed: [{allowed}] | Forbidden: [{forbidden}]. "
            f"Reason: {rule['reason']}"
        )

    return "\n".join(lines)
