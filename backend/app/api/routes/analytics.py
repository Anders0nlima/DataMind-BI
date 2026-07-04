"""DataMind BI — Analytics API Routes.

Exposes REST endpoints for:
1. Dataset uploads (multipart) and DuckDB schema ingestion.
2. AI orchestration (Text-to-SQL pipeline) using Server-Sent Events (SSE).
3. Direct academic statistical functions bypassing the LLM.
"""

import os
import json
import tempfile
import asyncio
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import duckdb

from app.core.config import get_settings
from app.services.dataset_ingestion import DuckDBSandbox
from app.models.domain_schemas import DuckDBSchema
from app.services.ai.provider import GeminiProvider, MockLLMProvider
from app.services.ai.code_interpreter import CodeInterpreter

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Local tmp directory for sandboxed datasets
UPLOAD_DIR = Path(tempfile.gettempdir()) / "datamind_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ChatQueryRequest(BaseModel):
    dataset_path: str
    dataset_schema: dict
    question: str


class QuickActionRequest(BaseModel):
    action: str  # "sturges" or "sample_size"
    data: list[float] | None = None
    population: int | None = None
    error_margin: float | None = None


@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Receives a file, ingests it via DuckDB, and returns the strict schema."""
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Somente arquivos .csv ou .xlsx são permitidos.")
        
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    try:
        # Calls the DuckDB ingestion engine (Commit 4)
        sandbox = DuckDBSandbox()
        try:
            if str(file_path).endswith('.csv'):
                sandbox.load_csv(file_path)
            else:
                sandbox.load_xlsx(file_path)
            schema = sandbox.extract_schema()
        finally:
            sandbox.close()

        
        # We also create a persistent local DuckDB file for the CodeInterpreter to query
        db_path = str(file_path.with_suffix('.duckdb'))
        if not os.path.exists(db_path):
            with duckdb.connect(db_path) as conn:
                if file.filename.endswith('.csv'):
                    conn.execute(f"CREATE TABLE {schema.table_name} AS SELECT * FROM read_csv_auto('{file_path}')")
                else:
                    conn.execute("INSTALL spatial; LOAD spatial;")
                    conn.execute(f"CREATE TABLE {schema.table_name} AS SELECT * FROM st_read('{file_path}')")
                    
        return {
            "dataset_path": db_path,
            "schema": schema.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na ingestão: {str(e)}")


@router.post("/chat/query")
async def chat_query(request: ChatQueryRequest):
    """Executes the AI Code Interpreter pipeline via SSE (Server-Sent Events).
    
    Streams the AI thought process back to the client for a modern, responsive UI.
    """
    
    async def event_generator():
        try:
            # Event 1: Initialization
            yield f"data: {json.dumps({'status': 'processing', 'message': 'Iniciando análise metodológica (Guardrails)...'})}\n\n"
            await asyncio.sleep(0.1) # Small delay for UX in tests
            
            schema = DuckDBSchema(**request.dataset_schema)
            
            # Use MockProvider for deterministic tests, Gemini for production
            settings = get_settings()
            if settings.gemini_api_key == "mock_key_for_testing" or not settings.gemini_api_key:
                provider = MockLLMProvider()
            else:
                provider = GeminiProvider()
                
            interpreter = CodeInterpreter(provider)
            
            # Event 2: LLM Planning
            yield f"data: {json.dumps({'status': 'processing', 'message': 'Gerando plano de execução e validação SQL...'})}\n\n"
            await asyncio.sleep(0.1)
            
            # Execute Pipeline (Commit 11)
            response = await interpreter.answer_question(
                db_path=request.dataset_path,
                schema=schema,
                user_question=request.question
            )
            
            # Event 3: Final Output
            yield f"data: {json.dumps({'status': 'completed', 'response': response.model_dump()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/statistics/quick-action")
async def execute_quick_action(request: QuickActionRequest):
    """Bypasses LLM entirely to execute pure deterministic academic statistics."""
    if request.action == "sturges" and request.data:
        from app.services.statistics.frequency import calculate_sturges_distribution
        return calculate_sturges_distribution(request.data)
        
    elif request.action == "sample_size" and request.population and request.error_margin:
        from app.services.statistics.sampling import calculate_sample_size
        return calculate_sample_size(request.population, request.error_margin)
        
    else:
        raise HTTPException(status_code=400, detail="Ação inválida ou parâmetros faltando.")
