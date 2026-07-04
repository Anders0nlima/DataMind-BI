"""Tests for the Analytics API Routes.

Proves the integration of ingestion, statistical logic, and the AI Code Interpreter 
through standard HTTP and SSE channels.
"""

import pytest
import tempfile
import json
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client():
    """Provides a TestClient for the FastAPI app."""
    app = create_app()
    return TestClient(app)


def test_quick_action_sturges(client):
    """Proves the /statistics/quick-action endpoint correctly calls the Sturges engine."""
    payload = {
        "action": "sturges",
        "data": [10.5, 12.0, 15.0, 15.5, 18.0, 20.0, 25.0, 30.0, 35.0, 40.0]
    }
    response = client.post("/api/analytics/statistics/quick-action", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "total_elements" in data
    assert data["total_elements"] == 10
    assert "sturges_k" in data


def test_quick_action_sample_size(client):
    """Proves the /statistics/quick-action endpoint correctly calls the sampling engine."""
    payload = {
        "action": "sample_size",
        "population": 100000,
        "error_margin": 0.05
    }
    response = client.post("/api/analytics/statistics/quick-action", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["population_size"] == 100000
    assert data["final_sample_size_n"] == 398


def test_upload_and_chat_pipeline(client):
    """Proves the end-to-end integration: upload a file, ingest it, and stream AI thoughts."""
    
    # 1. Create a dummy CSV file
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False) as tmp:
        tmp.write("id,nome,idade,salario\n1,Ana,25,3000.50\n2,Bruno,30,4500.00\n3,Carlos,40,8000.00\n")
        csv_path = tmp.name
        
    try:
        # 2. Upload it
        with open(csv_path, "rb") as f:
            upload_response = client.post(
                "/api/analytics/datasets/upload",
                files={"file": ("test_dataset.csv", f, "text/csv")}
            )
            
        assert upload_response.status_code == 200
        upload_data = upload_response.json()
        assert "schema" in upload_data
        assert "dataset_path" in upload_data
        assert upload_data["schema"]["total_rows"] == 3
        
        # 3. Ask a question via SSE Chat endpoint
        chat_payload = {
            "dataset_path": upload_data["dataset_path"],
            "dataset_schema": upload_data["schema"],
            "question": "Qual a média de salário?"
        }
        
        chat_response = client.post("/api/analytics/chat/query", json=chat_payload)
        
        # Assert it's a Server-Sent Events stream
        assert chat_response.status_code == 200
        assert "text/event-stream" in chat_response.headers.get("content-type", "")
        
        # Collect the chunks
        events = chat_response.iter_lines()
        chunks = []
        for event in events:
            if event.startswith("data: "):
                data_str = event.replace("data: ", "")
                chunks.append(json.loads(data_str))
                
        # Assert the SSE logic ran successfully
        assert len(chunks) == 3
        assert chunks[0]["status"] == "processing"
        assert "Iniciando" in chunks[0]["message"]
        
        assert chunks[1]["status"] == "processing"
        
        assert chunks[2]["status"] == "completed"
        assert "response" in chunks[2]
        
    finally:
        # Cleanup
        if Path(csv_path).exists():
            Path(csv_path).unlink()
