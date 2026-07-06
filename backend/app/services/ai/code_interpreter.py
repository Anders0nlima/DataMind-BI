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
        
        # ── Pass 0: Guardrail Interception Middleware ────────────────────
        from app.services.ai.guardrails import intercept_methodological_errors
        
        correction = intercept_methodological_errors(schema, user_question)
        if correction:
            logger.warning("Query intercepted by deterministic guardrails before LLM call.")
            return BIQueryResponse(
                narration=correction,
                visuals=[],
                sql_executed=None
            )
            
        # ── Pass 0.5: Advanced Statistical Interception (Sturges) ──────────
        question_lower = user_question.lower()
        if "sturges" in question_lower or "distribuição de frequência" in question_lower or "frequência" in question_lower:
            from app.models.domain_schemas import VariableType, IBGETableSpec, TableColumnDef, GenerativeUIPayload
            
            # Find which quantitative column the user is talking about
            target_col = None
            quant_cols = [
                col.name for col in schema.columns 
                if col.variable_type in [VariableType.QUANTITATIVE_CONTINUOUS, VariableType.QUANTITATIVE_DISCRETE]
            ]
            
            for col_name in quant_cols:
                # Fuzzy match: split column name by underscores and check if any word is in the question
                clean_name = col_name.lower().replace("_", " ")
                # Check for direct substring after replacing underscores
                if clean_name in question_lower:
                    target_col = col_name
                    break
                
                # Check word by word (e.g. "renda" in "renda familiar")
                words = clean_name.split()
                if any(len(w) > 3 and w in question_lower for w in words):
                    target_col = col_name
                    break
                    
            # If still not found but there's exactly one quantitative column in the dataset, just use it
            if not target_col and len(quant_cols) == 1:
                target_col = quant_cols[0]
            # If multiple, default to the first one
            elif not target_col and quant_cols:
                target_col = quant_cols[0]
            
            if target_col:
                logger.info(f"Intercepting Sturges request for column: {target_col}")
                with duckdb.connect(db_path, read_only=True) as conn:
                    # Extract raw data to python for Sturges calculation (no pandas needed)
                    data_tuples = conn.execute(f"SELECT \"{target_col}\" FROM {schema.table_name} WHERE \"{target_col}\" IS NOT NULL").fetchall()
                    data = [float(row[0]) for row in data_tuples if row[0] is not None]
                
                from app.services.statistics.frequency import calculate_sturges_distribution
                freq_dist = calculate_sturges_distribution(data)
                
                table_spec = IBGETableSpec(
                    title=f"Distribuição de Frequências (Regra de Sturges) - {target_col}",
                    columns=[
                        TableColumnDef(header="Classes", accessor_key="class_name"),
                        TableColumnDef(header="Ponto Médio (xi)", accessor_key="midpoint"),
                        TableColumnDef(header="Freq. Absoluta (fi)", accessor_key="absolute_freq"),
                        TableColumnDef(header="Freq. Relativa (fr %)", accessor_key="relative_freq"),
                        TableColumnDef(header="Freq. Acum. (Fi)", accessor_key="cumulative_freq"),
                        TableColumnDef(header="Freq. Rel. Acum. (Fr %)", accessor_key="cumulative_relative_freq"),
                    ],
                    data=freq_dist["table"],
                    source_footer="DataMind BI (Motor Estatístico Interno)",
                    has_vertical_borders=False
                )
                
                return BIQueryResponse(
                    narration=f"Para a variável **{target_col}**, acionei o nosso motor estatístico interno para calcular a distribuição de frequências utilizando a **Regra de Sturges**, garantindo exatidão sem risco de alucinação pela IA.\n\nA amplitude total dos dados foi de **{freq_dist['amplitude_total']}**, dividida em **{freq_dist['sturges_k']} classes**, resultando em uma amplitude de classe (h) de **{freq_dist['class_amplitude']}**.",
                    visuals=[
                        GenerativeUIPayload(
                            component_type="TABLE",
                            spec=table_spec
                        )
                    ],
                    sql_executed=f"-- Interceptação Metodológica\n-- O cálculo de Sturges foi delegado ao motor estatístico em Python para a coluna {target_col} (bypassing LLM SQL)."
                )
        
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
                # Execute and get pure python data types, bypassing pandas/numpy
                cursor = conn.execute(sql_query)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                raw_results = [dict(zip(columns, row)) for row in rows]
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
