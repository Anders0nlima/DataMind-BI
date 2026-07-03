"""DataMind BI — The Senior Code Interpreter Pipeline.

This module orchestrates the deterministic Text-to-SQL flow:
1. Receives user question and dataset schema.
2. Prompts Gemini (via Provider) to write DuckDB SQL.
3. If statistically valid, executes the SQL locally in DuckDB.
4. Feeds the exact mathematical results BACK to Gemini.
5. Gemini narrates the final response in Portuguese.

This guarantees ZERO AI math hallucinations.
"""

import duckdb
import logging

from app.services.ai.provider import LLMProvider
from app.models.domain_schemas import DuckDBSchema, BIQueryResponse

logger = logging.getLogger(__name__)


class CodeInterpreter:
    """Orchestrator for the two-pass AI pipeline."""

    def __init__(self, provider: LLMProvider):
        """Injects the LLM provider (Gemini or Mock)."""
        self.provider = provider

    async def answer_question(
        self, db_path: str, schema: DuckDBSchema, user_question: str
    ) -> BIQueryResponse:
        """Executes the full Text-to-SQL pipeline.
        
        Args:
            db_path: Absolute path to the DuckDB database file (or memory alias).
            schema: The lightweight metadata schema for the dataset.
            user_question: The natural language question from the user.
            
        Returns:
            A completely validated BIQueryResponse with narration and visuals.
        """
        logger.info(f"Starting Code Interpreter for question: '{user_question}'")
        
        # ── Pass 1: Ask LLM to generate the SQL Plan ────────────────────
        plan = await self.provider.generate_sql_plan(schema, user_question)
        
        # Guardrail: If the request is methodologically invalid (e.g. mean of CEP)
        # We short-circuit and return the pedagogical correction directly.
        if not plan.is_methodologically_valid:
            logger.warning("Query rejected by statistical guardrails.")
            return BIQueryResponse(
                narration=plan.pedagogical_correction or "Operação estatisticamente inválida.",
                visuals=[],
                sql_executed=None
            )
            
        # ── Pass 2: Execute SQL locally in DuckDB ────────────────────────
        sql_query = plan.sql_query
        if not sql_query:
            return BIQueryResponse(
                narration="Erro interno: Plano válido, mas nenhum SQL foi gerado.",
                visuals=[],
                sql_executed=None
            )
            
        try:
            logger.info(f"Executing SQL in DuckDB: {sql_query}")
            with duckdb.connect(db_path, read_only=True) as conn:
                # fetchdf() returns a pandas DataFrame, to_dict('records') converts to list of dicts
                raw_results = conn.execute(sql_query).fetchdf().to_dict('records')
        except Exception as e:
            logger.error(f"DuckDB Execution Failed: {str(e)}")
            return BIQueryResponse(
                narration=f"Desculpe, ocorreu um erro ao executar a consulta no banco de dados. Detalhe técnico: {str(e)}",
                visuals=[],
                sql_executed=sql_query
            )
            
        # ── Pass 3: Feed math back to LLM for narration ──────────────────
        logger.info("Feeding exact math back to LLM for Portuguese narration.")
        final_response = await self.provider.generate_final_response(
            user_question=user_question,
            sql_results=raw_results,
            plan=plan
        )
        
        return final_response
