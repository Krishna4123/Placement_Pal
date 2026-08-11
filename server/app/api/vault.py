"""
app/api/vault.py
─────────────────
Router: /vault

Endpoints for knowledge vault management: file upload, semantic query,
topic CRUD.
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, File, UploadFile, Form, status
from fastapi.responses import JSONResponse

from app.services.vault_service import VaultService
from app.chains.resume_parser_chain import ResumeParserChain
from app.models.request_models import VaultQueryRequest, TopicCreateRequest
from app.models.response_models import (
    APIResponse,
    VaultUploadResponse,
    VaultQueryResponse,
    TopicResponse,
)

router = APIRouter(prefix="/vault", tags=["Vault"])
vault_service = VaultService()
resume_parser_chain = ResumeParserChain()


@router.post(
    "/upload",
    summary="Upload a document to the knowledge vault",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[VaultUploadResponse],
)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or text file, chunk it, embed it, and store it in ChromaDB.
    """
    content = await file.read()
    res = await vault_service.upload_file(file.filename, content)
    resp_data = VaultUploadResponse(
        file_id=res["file_id"],
        filename=res["filename"],
        chunks_ingested=res["chunks_ingested"],
        status=res["status"],
    )
    return APIResponse[VaultUploadResponse](
        success=True,
        message="File processed and ingested successfully",
        data=resp_data,
    )


@router.post(
    "/upload-resume",
    summary="Upload a resume and extract technical skills via Gemini LLM",
    status_code=status.HTTP_200_OK,
)
async def upload_resume(
    file: UploadFile = File(...),
    target_company: str = Form("Target Company"),
    target_role: str = Form("Software Engineer"),
):
    """
    Parse resume content (PDF, DOCX, TXT, PNG, JPG), extract technical skills,
    ingest into ChromaDB knowledge vault, and return structured skill analysis.
    """
    content = await file.read()
    
    # 1. Extract skills via Gemini / ResumeParserChain
    parsed = await resume_parser_chain.parse_resume(
        filename=file.filename,
        content=content,
        target_company=target_company,
        target_role=target_role,
    )
    
    # 2. Ingest document into ChromaDB vault
    file_id = f"res_{file.filename}"
    try:
        vault_res = await vault_service.upload_file(file.filename, content)
        if vault_res and "file_id" in vault_res:
            file_id = vault_res["file_id"]
    except Exception as err:
        import logging
        logging.getLogger(__name__).warning("Vault ingestion notice: %s", err)

    resp_data = {
        "file_id": file_id,
        "filename": file.filename,
        "extracted_skills": parsed["extracted_skills"],
        "strengths": parsed["strengths"],
        "status": "ingested",
    }

    return APIResponse[dict[str, Any]](
        success=True,
        message="Resume processed and skills extracted successfully",
        data=resp_data,
    )


@router.post(
    "/query",
    summary="Semantic search against the knowledge vault with LLM RAG augmentation",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[VaultQueryResponse],
)
async def query_vault(body: VaultQueryRequest):
    """
    Perform semantic search and return LLM-augmented answer with ranked source documents.
    """
    res = await vault_service.query_vault(
        query=body.query,
        collection_name=body.collection_name,
        n_results=body.n_results,
    )
    resp_data = VaultQueryResponse(
        results=res["results"],
        answer=res.get("answer"),
        total=res["total"],
    )
    return APIResponse[VaultQueryResponse](
        success=True,
        message="Vault RAG query executed successfully",
        data=resp_data,
    )



@router.post(
    "/topics",
    summary="Add a topic to the knowledge vault",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[TopicResponse],
)
async def create_topic(body: TopicCreateRequest):
    """
    Create a new topic entry in MongoDB.
    """
    topic_dict = body.model_dump()
    res = await vault_service.create_topic(topic_dict)
    resp_data = TopicResponse(
        topic_id=res["topic_id"],
        name=res["name"],
        category=res["category"],
        status="created",
    )
    return APIResponse[TopicResponse](
        success=True,
        message="Topic created successfully",
        data=resp_data,
    )


@router.get(
    "/topics",
    summary="List all manual topics in the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def list_topics():
    """
    Retrieve all manual topics stored in MongoDB.
    """
    topics = await vault_service.list_topics()
    return APIResponse[list[dict]](
        success=True,
        message="Topics retrieved successfully",
        data=topics,
    )


@router.get(
    "/files",
    summary="List all uploaded files in the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def list_files():
    """
    Retrieve all file metadata stored in MongoDB.
    """
    files = await vault_service.list_files()
    return APIResponse[list[dict]](
        success=True,
        message="Files retrieved successfully",
        data=files,
    )


@router.delete(
    "/topics/{topic_id}",
    summary="Delete a topic from the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def delete_topic(topic_id: str):
    """
    Remove a topic by ID from MongoDB.
    """
    deleted = await vault_service.delete_topic(topic_id)
    return APIResponse[dict](
        success=deleted,
        message=f"Topic {topic_id} {'deleted' if deleted else 'not found'}",
        data={"topic_id": topic_id, "deleted": deleted},
    )


@router.delete(
    "/files/{file_id}",
    summary="Delete a file from the knowledge vault",
    status_code=status.HTTP_200_OK,
)
async def delete_file(file_id: str):
    """
    Remove an uploaded file record by file_id from MongoDB.
    """
    deleted = await vault_service.delete_file(file_id)
    return APIResponse[dict](
        success=deleted,
        message=f"File {file_id} {'deleted' if deleted else 'not found'}",
        data={"file_id": file_id, "deleted": deleted},
    )

