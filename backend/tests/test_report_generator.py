"""Tests for the ReportLab PDF Generator."""

import pytest
from io import BytesIO

from app.services.report_generator import generate_ibge_pdf
from app.models.domain_schemas import IBGETableSpec, TableColumnDef


@pytest.fixture
def sample_ibge_spec() -> IBGETableSpec:
    """Fixture that generates a fully compliant IBGETableSpec."""
    return IBGETableSpec(
        title="Tabela 1 - Distribuição de Idades na População (Simulada)",
        columns=[
            TableColumnDef(header="Faixa Etária", accessor_key="faixa"),
            TableColumnDef(header="Frequência Absoluta (fi)", accessor_key="freq"),
            TableColumnDef(header="Frequência Relativa (%)", accessor_key="rel")
        ],
        data=[
            {"faixa": "10 ├─ 20", "freq": 150, "rel": 15.0},
            {"faixa": "20 ├─ 30", "freq": 450, "rel": 45.0},
            {"faixa": "30 ├─ 40", "freq": 300, "rel": 30.0},
            {"faixa": "40 ├─┤ 50", "freq": 100, "rel": 10.0}
        ],
        source_footer="Dados Primários - Sistema DataMind BI (2026)",
        has_vertical_borders=False  # Must be strictly False
    )


def test_generate_ibge_pdf_compiles_successfully(sample_ibge_spec):
    """Proves that ReportLab can take our Pydantic spec and compile a raw PDF binary."""
    pdf_buffer = generate_ibge_pdf(sample_ibge_spec)
    
    assert isinstance(pdf_buffer, BytesIO)
    
    # Read the binary data generated
    pdf_bytes = pdf_buffer.read()
    
    # Assert the buffer is populated
    assert len(pdf_bytes) > 1000  # A basic PDF is at least a few KB
    
    # Assert it has the standard PDF magic number header
    assert pdf_bytes.startswith(b"%PDF-1.")
    
    # Assert it ends with the standard EOF marker
    assert b"%%EOF" in pdf_bytes[-100:]  # Search in the last 100 bytes


def test_generate_ibge_pdf_handles_empty_data():
    """Proves the generator doesn't crash on an empty dataset."""
    empty_spec = IBGETableSpec(
        title="Tabela Vazia",
        columns=[TableColumnDef(header="Coluna A", accessor_key="col_a")],
        data=[],
        source_footer="Nenhuma fonte"
    )
    
    pdf_buffer = generate_ibge_pdf(empty_spec)
    pdf_bytes = pdf_buffer.read()
    
    assert pdf_bytes.startswith(b"%PDF-1.")
