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
    ) -> list[dict[str, Any]]:
        """
        Semantic search against the ChromaDB vault via LangChain retriever.
        """
        import asyncio
        results = await asyncio.to_thread(
            query_documents, query, collection_name, n_results
        )
        return results

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
