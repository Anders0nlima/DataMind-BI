"""DataMind BI — DuckDB Dataset Ingestion Service.

Responsible for converting uploaded .csv and .xlsx files into a fast,
isolated, in-memory analytical DuckDB instance. Extracts purely the schema
and sample rows to be safely sent to the AI LLM (Code Interpreter pattern).
"""

import os
import csv
import tempfile
from pathlib import Path

import duckdb
import openpyxl

from app.models.domain_schemas import DuckDBSchema, ColumnSchema, VariableType


def infer_basic_variable_type(sql_type: str) -> VariableType:
    """Basic heuristic for variable typing based on SQL datatypes.
    
    Note: Full IBGE typification heuristics will be implemented in Commit 5.
    This serves as a placeholder to satisfy the ColumnSchema requirement.
    """
    sql_type = sql_type.upper()
    if any(t in sql_type for t in ("INT", "LONG")):
        return VariableType.QUANTITATIVE_DISCRETE
    elif any(t in sql_type for t in ("DOUBLE", "FLOAT", "DECIMAL", "REAL", "NUMERIC")):
        return VariableType.QUANTITATIVE_CONTINUOUS
    else:
        return VariableType.QUALITATIVE_NOMINAL


class DuckDBSandbox:
    """In-memory DuckDB sandbox for isolated analytical queries."""
    
    def __init__(self) -> None:
        """Initializes a new ephemeral in-memory database session."""
        self.conn = duckdb.connect()

    def load_csv(self, file_path: str | Path, table_name: str = "dataset") -> None:
        """Loads a CSV file directly into the sandbox."""
        query = f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{str(file_path)}')"
        self.conn.execute(query)

    def load_xlsx(self, file_path: str | Path, table_name: str = "dataset") -> None:
        """Loads an Excel file into the sandbox using openpyxl.
        
        Since DuckDB's native excel reader requires the spatial extension, 
        we ensure stability and formatting retention by using openpyxl to
        stream the workbook into a temporary CSV, then ingesting that.
        """
        wb = openpyxl.load_workbook(file_path, data_only=True)
        ws = wb.active
        
        fd, temp_csv_path = tempfile.mkstemp(suffix=".csv")
        with open(fd, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for row in ws.iter_rows(values_only=True):
                writer.writerow(row)
                
        try:
            self.load_csv(temp_csv_path, table_name)
        finally:
            os.remove(temp_csv_path)

    def extract_schema(self, table_name: str = "dataset") -> DuckDBSchema:
        """Extracts column metadata and 3 sample rows to securely send to the LLM.
        
        Raw data rows (beyond the 3 samples) are strictly excluded, enforcing
        data privacy and forcing the AI to query DuckDB rather than doing math itself.
        """
        # Get total rows
        total_rows = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        # Get column names and types via DuckDB PRAGMA
        # PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
        table_info = self.conn.execute(f"PRAGMA table_info('{table_name}')").fetchall()
        
        columns = []
        for col in table_info:
            col_name = col[1]
            sql_type = col[2]
            
            # Get 3 non-null sample values for this column
            sample_query = f"""
                SELECT "{col_name}" 
                FROM {table_name} 
                WHERE "{col_name}" IS NOT NULL 
                LIMIT 3
            """
            samples = [row[0] for row in self.conn.execute(sample_query).fetchall()]
            
            var_type = infer_basic_variable_type(sql_type)
            
            columns.append(ColumnSchema(
                name=col_name,
                sql_type=sql_type,
                variable_type=var_type,
                sample_values=samples
            ))
            
        return DuckDBSchema(
            table_name=table_name,
            total_rows=total_rows,
            columns=columns
        )

    def close(self) -> None:
        """Closes the connection, destroying the in-memory data."""
        self.conn.close()
