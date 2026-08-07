"""
app/api/vault.py
─────────────────
Router: /vault

Endpoints for knowledge vault management: file upload, semantic query,
topic CRUD.
"""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import JSONResponse

from app.models.request_models import VaultQueryRequest, TopicCreateRequest

router = APIRouter(prefix="/vault", tags=["Vault"])


@router.post(
    "/upload",
    summary="Upload a document to the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or text file, chunk it, embed it, and store it in ChromaDB.

    TODO:
        - Read file bytes
        - Delegate to VaultService.upload_file()
        - Return real VaultUploadResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "File upload mock response",
            "data": {
                "file_id": "mock-file-id-001",
                "filename": file.filename,
                "chunks_ingested": 0,
                "status": "uploaded",
            },
        },
    )


@router.post(
    "/query",
    summary="Semantic search against the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def query_vault(body: VaultQueryRequest):
    """
    Perform a semantic similarity search and return ranked results.

    TODO:
        - Delegate to VaultService.query_vault()
        - Return real VaultQueryResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Vault query mock response",
            "data": {
                "results": [{"mock": True, "document": "Sample result", "score": 0.95}],
                "total": 1,
            },
        },
    )


@router.post(
    "/topics",
    summary="Add a topic to the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def create_topic(body: TopicCreateRequest):
    """
    Create a new topic entry in MongoDB.

    TODO:
        - Delegate to VaultService.create_topic()
        - Return real TopicResponse
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Topic created (mock)",
            "data": {
                "topic_id": "mock-topic-id-001",
                "name": body.name,
                "category": body.category,
                "status": "created",
            },
        },
    )


@router.delete(
    "/topics/{topic_id}",
    summary="Delete a topic from the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def delete_topic(topic_id: str):
    """
    Remove a topic by ID from MongoDB (and optionally ChromaDB).

    TODO:
        - Delegate to VaultService.delete_topic()
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": f"Topic {topic_id} deleted (mock)",
            "data": {"topic_id": topic_id, "deleted": True},
        },
    )
