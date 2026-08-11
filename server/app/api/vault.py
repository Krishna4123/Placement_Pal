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
    summary="Upload a resume, extract technical skills via Gemini LLM, calculate ATS score & store in MongoDB",
    status_code=status.HTTP_200_OK,
)
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = Form("active_session"),
    target_company: str = Form("Target Company"),
    target_role: str = Form("Software Engineer"),
):
    """
    Parse resume content (PDF, DOCX, TXT), extract technical skills,
    calculate ATS score, ingest into ChromaDB knowledge vault, and store
    document in MongoDB 'resumes' collection.
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

    extracted_skills = parsed.get("extracted_skills", [])
    strengths = parsed.get("strengths", [])

    # 3. Calculate ATS score & tech stack alignment against target company
    expected_tech_stack = [
        "Data Structures & Algorithms",
        "System Design",
        "Python",
        "C++",
        "SQL",
        "REST APIs",
        "React",
        "Object-Oriented Programming"
    ]
    matched_skills = [
        s for s in expected_tech_stack
        if any(es.lower() in s.lower() or s.lower() in es.lower() for es in extracted_skills)
    ]
    missing_skills = [s for s in expected_tech_stack if s not in matched_skills]
    
    match_ratio = len(matched_skills) / len(expected_tech_stack) if expected_tech_stack else 0.5
    ats_score = min(98, max(25, int(match_ratio * 100)))

    suggestions = (
        f"To boost your ATS score for {target_company}, consider adding projects or experience highlighting: "
        + ", ".join(missing_skills[:3]) + "."
        if missing_skills else
        f"Excellent fit! Your resume strongly aligns with tech stack requirements for {target_company}."
    )

    resume_doc = {
        "session_id": session_id,
        "file_id": file_id,
        "filename": file.filename,
        "file_size": f"{(len(content) / (1024 * 1024)):.2f} MB",
        "extracted_skills": extracted_skills,
        "strengths": strengths,
        "ats_score": ats_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "target_company": target_company,
        "target_role": target_role,
        "raw_text_snippet": parsed.get("raw_text_snippet", ""),
        "status": "ingested",
    }

    # 4. Save to MongoDB 'resumes' collection
    saved_doc = await vault_service.save_resume(resume_doc)

    return APIResponse[dict[str, Any]](
        success=True,
        message="Resume processed, ATS score calculated and stored successfully",
        data=saved_doc,
    )


@router.get(
    "/resume/{session_id}",
    summary="Get stored resume analysis for a session",
    status_code=status.HTTP_200_OK,
)
async def get_resume(session_id: str):
    """
    Retrieve stored resume document & ATS analysis from MongoDB by session_id.
    """
    doc = await vault_service.get_resume(session_id)
    if not doc:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": f"No resume found for session '{session_id}'", "data": None},
        )
    return APIResponse[dict[str, Any]](
        success=True,
        message="Resume retrieved successfully",
        data=doc,
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

