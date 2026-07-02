"""Tests for the DuckDB in-memory dataset ingestion service."""

import csv
import pytest
import openpyxl

from app.services.dataset_ingestion import DuckDBSandbox
from app.models.domain_schemas import VariableType


@pytest.fixture
def sample_csv(tmp_path):
    """Generates a temporary CSV file with test data."""
    csv_file = tmp_path / "test_data.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "product", "price", "quantity"])
        writer.writerow([1, "Apple", 1.50, 10])
        writer.writerow([2, "Banana", 0.75, 20])
        writer.writerow([3, "Cherry", 2.00, 15])
        writer.writerow([4, "Date", 3.00, 5])
    return csv_file


@pytest.fixture
def sample_xlsx(tmp_path):
    """Generates a temporary Excel file with test data."""
    xlsx_file = tmp_path / "test_data.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["id", "product", "price", "quantity"])
    ws.append([1, "Apple", 1.50, 10])
    ws.append([2, "Banana", 0.75, 20])
    ws.append([3, "Cherry", 2.00, 15])
    ws.append([4, "Date", 3.00, 5])
    wb.save(xlsx_file)
    return xlsx_file


def test_ingest_csv_and_extract_schema(sample_csv):
    """Tests loading a CSV and extracting its schema and samples."""
    sandbox = DuckDBSandbox()
    
    try:
        sandbox.load_csv(sample_csv, "test_table")
        schema = sandbox.extract_schema("test_table")
        
        assert schema.table_name == "test_table"
        assert schema.total_rows == 4
        assert len(schema.columns) == 4
        
        # Verify specific column parsing and inference
        product_col = next(c for c in schema.columns if c.name == "product")
        assert product_col.variable_type == VariableType.QUALITATIVE_NOMINAL
        assert len(product_col.sample_values) == 3
        assert "Apple" in product_col.sample_values
        
        quantity_col = next(c for c in schema.columns if c.name == "quantity")
        assert quantity_col.variable_type == VariableType.QUANTITATIVE_DISCRETE
        
    finally:
        sandbox.close()


def test_ingest_xlsx_and_extract_schema(sample_xlsx):
    """Tests loading an Excel file via openpyxl and extracting schema."""
    sandbox = DuckDBSandbox()
    
    try:
        sandbox.load_xlsx(sample_xlsx, "test_excel")
        schema = sandbox.extract_schema("test_excel")
        
        assert schema.table_name == "test_excel"
        assert schema.total_rows == 4
        
        price_col = next(c for c in schema.columns if c.name == "price")
        # DuckDB usually infers DOUBLE for float numbers
        assert price_col.variable_type == VariableType.QUANTITATIVE_CONTINUOUS
        assert 1.50 in price_col.sample_values
        
    finally:
        sandbox.close()
