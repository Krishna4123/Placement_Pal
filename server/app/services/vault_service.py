"""
app/services/vault_service.py
──────────────────────────────
Service layer for the knowledge vault.

Uses LangChain document loaders and text splitters for file processing,
ChromaDB (via LangChain wrapper) for vector storage, and Motor for metadata.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.database.chroma import ingest_documents, query_documents
from app.database.collections import get_vault_files_collection, get_topics_collection
from app.utils.constants import (
    ALLOWED_UPLOAD_EXTENSIONS,
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    MAX_UPLOAD_SIZE_MB,
)

logger = logging.getLogger(__name__)

_UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
_UPLOAD_DIR.mkdir(exist_ok=True)

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=DEFAULT_CHUNK_SIZE,
    chunk_overlap=DEFAULT_CHUNK_OVERLAP,
)


class VaultService:
    """Manages file ingestion, ChromaDB operations, and topic CRUD."""

    async def upload_file(self, filename: str, content: bytes) -> dict[str, Any]:
        """
        Process and store an uploaded file.

        Steps:
          1. Validate file type and size.
          2. Save to disk temporarily.
          3. Load with LangChain document loader.
          4. Split with RecursiveCharacterTextSplitter.
          5. Ingest into ChromaDB via LangChain vectorstore.
          6. Persist metadata in MongoDB 'vault_files' collection.
        """
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_UPLOAD_EXTENSIONS:
            raise ValueError(
                f"File type '{suffix}' not allowed. "
                f"Allowed: {ALLOWED_UPLOAD_EXTENSIONS}"
            )
        if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File exceeds {MAX_UPLOAD_SIZE_MB} MB limit.")

        file_id = str(uuid.uuid4())
        tmp_path = _UPLOAD_DIR / f"{file_id}{suffix}"
        tmp_path.write_bytes(content)

        try:
            # Load with LangChain loader
            if suffix == ".pdf":
                loader = PyPDFLoader(str(tmp_path))
            else:
                loader = TextLoader(str(tmp_path), encoding="utf-8")

            raw_docs = loader.load()
            chunks = _splitter.split_documents(raw_docs)

            # Extract page_content and metadata separately for ingest_documents()
            texts = [c.page_content for c in chunks]
            metadatas = [
                {**c.metadata, "file_id": file_id, "filename": filename}
                for c in chunks
            ]
            chunk_ids = ingest_documents(texts, metadatas)

            # Store metadata in MongoDB
            col = get_vault_files_collection()
            await col.insert_one({
                "file_id": file_id,
                "filename": filename,
                "suffix": suffix,
                "size_bytes": len(content),
                "chunks_ingested": len(chunk_ids),
                "chroma_ids": chunk_ids,
                "uploaded_at": datetime.utcnow(),
            })

            logger.info(
                "Uploaded %s → %d chunks ingested (file_id=%s)",
                filename, len(chunk_ids), file_id,
            )
            return {
                "file_id": file_id,
                "filename": filename,
                "chunks_ingested": len(chunk_ids),
                "status": "uploaded",
            }
        finally:
            # Clean up temp file
            if tmp_path.exists():
                tmp_path.unlink()

    async def query_vault(
        self,
        query: str,
        collection_name: Optional[str] = None,
        n_results: int = 5,
    ) -> dict[str, Any]:
        """
        Semantic search against ChromaDB vault + LLM Retrieval-Augmented Generation (RAG).
        """
        import asyncio
        from app.utils.llm import get_fast_llm
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        # 1. Retrieve matching chunks from vectorstore
        results = await asyncio.to_thread(
            query_documents, query, collection_name, n_results
        )

        # 2. Format context for RAG
        context_blocks = []
        for idx, doc in enumerate(results, 1):
            src = doc.get("metadata", {}).get("filename") or doc.get("metadata", {}).get("source") or f"Note #{idx}"
            content = doc.get("content", "").strip()
            if content:
                context_blocks.append(f"--- Document Source: {src} ---\n{content}")

        context_str = "\n\n".join(context_blocks) if context_blocks else "No matching document notes found in vault."

        # 3. Augment answer with LLM strictly using retrieved chunks ONLY
        answer: str | None = None
        try:
            rag_prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "You are a strict Knowledge Vault AI study assistant. "
                    "You MUST answer the student's question ONLY using the provided retrieved Knowledge Vault chunks. "
                    "Do NOT use external knowledge or invent facts not present in the retrieved chunks. "
                    "If the retrieved chunks do not contain the answer to the question, state: 'The uploaded notes in your Knowledge Vault do not contain information about this.' "
                    "If the answer is present in the chunks, provide a concise, simple explanation in 2 to 3 lines (max 3 sentences)."
                )),
                ("human", "Question: {query}\n\nRetrieved Knowledge Vault Chunks:\n{context}")
            ])
            llm = get_fast_llm()
            chain = rag_prompt | llm | StrOutputParser()
            answer = await chain.ainvoke({"query": query, "context": context_str})
        except Exception as exc:
            logger.warning("Vault RAG answer generation failed: %s", exc)
            answer = None


        return {
            "results": results,
            "answer": answer,
            "total": len(results),
        }


    async def create_topic(self, topic_data: dict[str, Any]) -> dict[str, Any]:
        """Add a new TopicEntry to the 'topics' MongoDB collection."""
        from app.models.topic import TopicEntry
        entry = TopicEntry(**topic_data)
        col = get_topics_collection()
        result = await col.insert_one(entry.model_dump(exclude={"topic_id"}))
        topic_id = str(result.inserted_id)
        logger.info("Created topic: %s (id=%s)", entry.name, topic_id)
        return {"topic_id": topic_id, "name": entry.name, "category": entry.category}

    async def delete_topic(self, topic_id: str) -> bool:
        """Remove a topic by MongoDB ObjectId string."""
        from bson import ObjectId
        col = get_topics_collection()
        result = await col.delete_one({"_id": ObjectId(topic_id)})
        deleted = result.deleted_count > 0
        if deleted:
            logger.info("Deleted topic: %s", topic_id)
        return deleted

    async def list_topics(self) -> list[dict[str, Any]]:
        """Return all topics from the 'topics' collection."""
        col = get_topics_collection()
        cursor = col.find({}, {"_id": 1, "name": 1, "category": 1, "difficulty": 1, "tags": 1})
        docs = await cursor.to_list(length=200)
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    async def list_files(self) -> list[dict[str, Any]]:
        """Return all uploaded file entries from 'vault_files' collection."""
        col = get_vault_files_collection()
        cursor = col.find({}, {"_id": 0, "file_id": 1, "filename": 1, "suffix": 1, "size_bytes": 1, "chunks_ingested": 1, "uploaded_at": 1})
        docs = await cursor.to_list(length=200)
        for d in docs:
            if "uploaded_at" in d and isinstance(d["uploaded_at"], datetime):
                d["uploaded_at"] = d["uploaded_at"].isoformat()
        return docs

    async def delete_file(self, file_id: str) -> bool:
        """Remove an uploaded file entry by file_id from 'vault_files' collection."""
        col = get_vault_files_collection()
        result = await col.delete_one({"file_id": file_id})
        deleted = result.deleted_count > 0
        if deleted:
            logger.info("Deleted file: %s", file_id)
        return deleted

    async def save_resume(self, resume_doc: dict[str, Any]) -> dict[str, Any]:
        """Upsert parsed resume document in MongoDB 'resumes' collection by session_id."""
        from app.database.collections import get_resumes_collection
        col = get_resumes_collection()
        session_id = resume_doc.get("session_id", "active_session")
        resume_doc["updated_at"] = datetime.utcnow()
        await col.update_one(
            {"session_id": session_id},
            {"$set": resume_doc},
            upsert=True,
        )
        logger.info("Saved resume for session %s (file: %s, ATS score: %s%%)", session_id, resume_doc.get("filename"), resume_doc.get("ats_score"))
        return resume_doc

    async def get_resume(self, session_id: str) -> dict[str, Any] | None:
        """Retrieve stored resume document from MongoDB 'resumes' collection by session_id."""
        from app.database.collections import get_resumes_collection
        col = get_resumes_collection()
        doc = await col.find_one({"session_id": session_id}, {"_id": 0})
        if not doc:
            # Fallback to active_session if requested session not found
            doc = await col.find_one({"session_id": "active_session"}, {"_id": 0})
        if doc and "uploaded_at" in doc and isinstance(doc["uploaded_at"], datetime):
            doc["uploaded_at"] = doc["uploaded_at"].isoformat()
        if doc and "updated_at" in doc and isinstance(doc["updated_at"], datetime):
            doc["updated_at"] = doc["updated_at"].isoformat()
        return doc


