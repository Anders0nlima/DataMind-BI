"""Domain-Driven Design schemas for DataMind BI.

These Pydantic models act as the strict gatekeepers for all data flowing
between the frontend, the DuckDB sandbox, and the Gemini LLM. They enforce
the statistical rules derived from the UFPA/IBGE curriculum.
"""

from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field

# ── 1. Statistical Heuristics & Variable Typification ───────────────

class VariableType(str, Enum):
    """Classificação estatística obrigatória (RF01 - Cap. 1.15)."""
    QUALITATIVE_NOMINAL = "QUALITATIVE_NOMINAL"
    QUALITATIVE_ORDINAL = "QUALITATIVE_ORDINAL"
    QUANTITATIVE_DISCRETE = "QUANTITATIVE_DISCRETE"
    QUANTITATIVE_CONTINUOUS = "QUANTITATIVE_CONTINUOUS"


# ── 2. DuckDB Sandbox Ingestion ─────────────────────────────────────

class ColumnSchema(BaseModel):
    """Represents a single column's metadata extracted from DuckDB."""
    name: str
    sql_type: str
    variable_type: VariableType = Field(
        ..., 
        description="The statistical classification of the variable."
    )
    sample_values: list[Any] = Field(
        ..., 
        description="A small sample of values (max 3) to give the LLM context without sending the whole dataset.",
        max_length=3
    )

class DuckDBSchema(BaseModel):
    """The lightweight skeleton sent to the LLM (RF14).
    
    Raw data rows are strictly excluded. This guarantees data privacy
    and prevents the LLM from attempting mathematical operations itself.
    """
    table_name: str
    total_rows: int
    columns: list[ColumnSchema]


# ── 3. AI Orchestration (LLM Contracts) ─────────────────────────────

class GeminiSQLPlan(BaseModel):
    """The strict JSON shape Gemini is forced to return when asked a question (RF15)."""
    thought_process: str = Field(
        ..., 
        description="Step-by-step reasoning explaining methodological choices."
    )
    is_methodologically_valid: bool = Field(
        ..., 
        description="False if the user requested a statistically invalid operation (e.g., mean of nominal variable)."
    )
    pedagogical_correction: str | None = Field(
        None, 
        description="If invalid, the pedagogical explanation citing UFPA/IBGE rules (RF18)."
    )
    sql_query: str | None = Field(
        None, 
        description="The deterministic DuckDB SQL query to execute. Null if the request is invalid."
    )


# ── 4. Generative UI Specs ──────────────────────────────────────────

class ChartType(str, Enum):
    """Restricted chart types based on Smart Charting rules (RF13)."""
    LINE = "LINE"
    COLUMN = "COLUMN"
    HORIZONTAL_BAR = "HORIZONTAL_BAR"
    PIE = "PIE"

class ChartSeries(BaseModel):
    name: str
    data_key: str

class GenerativeChartSpec(BaseModel):
    """Defines a chart to be dynamically rendered by Recharts."""
    chart_type: ChartType
    title: str
    x_axis_key: str
    series: list[ChartSeries]
    data: list[dict[str, Any]] = Field(
        ..., 
        description="The exact aggregated data points extracted from DuckDB."
    )
    aspect_ratio: str = Field(
        default="5:4", 
        description="Must be between 1:0.57 and 1:0.80 per RNF01."
    )

class TableColumnDef(BaseModel):
    header: str
    accessor_key: str

class IBGETableSpec(BaseModel):
    """Strictly enforces IBGE tabular presentation norms (RF12 - Cap. 5.1)."""
    title: str
    columns: list[TableColumnDef]
    data: list[dict[str, Any]]
    source_footer: str = Field(
        ..., 
        description="Mandatory source citation per IBGE rules."
    )
    has_vertical_borders: Literal[False] = Field(
        default=False, 
        description="Strictly forbidden by IBGE tabular norms."
    )

class GenerativeUIPayload(BaseModel):
    """A union of possible visual components the AI can request to render."""
    component_type: Literal["CHART", "TABLE", "METRIC_CARD"]
    spec: GenerativeChartSpec | IBGETableSpec | dict[str, Any]


# ── 5. API Responses ────────────────────────────────────────────────

class BIQueryResponse(BaseModel):
    """The final payload sent to the frontend (RF17)."""
    narration: str = Field(
        ..., 
        description="The AI's natural language answer in Portuguese, incorporating exact SQL results."
    )
    visuals: list[GenerativeUIPayload] = Field(
        default_factory=list,
        description="Any charts or tables to render in the center Generative UI canvas."
    )
    sql_executed: str | None = Field(
        None, 
        description="The actual query executed, for transparency and debugging."
    )
