"""
app/database/chroma.py
──────────────────────
ChromaDB helper using LangChain's Chroma vectorstore wrapper.

Uses LangChain's OpenAIEmbeddings (pointed at the institution's
embedding endpoint) so all embedding calls go through the same
API key / base URL configured in Settings.

Provides:
  - get_vectorstore()      – LangChain Chroma vectorstore instance
  - ingest_documents()     – chunk, embed, and store Documents
  - query_documents()      – semantic similarity search
  - get_retriever()        – LangChain retriever for use in LCEL chains
"""

from __future__ import annotations

import logging
import os
from typing import Any

# pyrefly: ignore [missing-import]
from langchain_chroma import Chroma
from langchain_core.documents import Document
# pyrefly: ignore [missing-import]
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.utils.constants import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_TOP_K,
)

logger = logging.getLogger(__name__)

# ── Module-level singletons ───────────────────────────────────
_embeddings: OpenAIEmbeddings | None = None
_vectorstore: Chroma | None = None
_text_splitter: RecursiveCharacterTextSplitter | None = None


def _get_embeddings() -> OpenAIEmbeddings:
    """
    Return (or lazily create) the OpenAIEmbeddings instance.

    Respects the institution's OPENAI_API_BASE and OPENAI_API_KEY so that
    embedding calls go to the same proxy as chat completions.
    """
    global _embeddings
    if _embeddings is None:
        settings = get_settings()
        kwargs: dict[str, Any] = {
            "model": settings.embedding_model,
            "api_key": settings.openai_api_key,
        }
        if settings.openai_api_base:
            kwargs["base_url"] = settings.openai_api_base
        _embeddings = OpenAIEmbeddings(**kwargs)
        logger.info("OpenAIEmbeddings initialised (model=%s)", settings.embedding_model)
    return _embeddings


def _get_text_splitter() -> RecursiveCharacterTextSplitter:
    """Return (or lazily create) the text splitter singleton."""
    global _text_splitter
    if _text_splitter is None:
        _text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=DEFAULT_CHUNK_SIZE,
            chunk_overlap=DEFAULT_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
    return _text_splitter


def get_vectorstore(collection_name: str | None = None) -> Chroma:
    """
    Return (or lazily create) the LangChain Chroma vectorstore.

    Args:
        collection_name: ChromaDB collection name. Defaults to settings value.

    Returns:
        langchain_chroma.Chroma instance ready for similarity search.
    """
    global _vectorstore
    if _vectorstore is None:
        settings = get_settings()
        col_name = collection_name or settings.chroma_collection
        _vectorstore = Chroma(
            collection_name=col_name,
            embedding_function=_get_embeddings(),
            persist_directory=settings.chroma_directory,
            collection_metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "Chroma vectorstore ready (collection=%s, dir=%s)",
            col_name, settings.chroma_directory,
        )
    return _vectorstore


def get_retriever(k: int = DEFAULT_TOP_K):
    """
    Return a LangChain retriever backed by Chroma.

    The retriever is directly usable in LCEL chains:
        retriever | format_docs | llm | StrOutputParser()

    Args:
        k: Number of documents to retrieve per query.
    """
    return get_vectorstore().as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )


def ingest_documents(
    texts: list[str],
    metadatas: list[dict[str, Any]] | None = None,
    collection_name: str | None = None,
) -> list[str]:
    """
    Chunk, embed, and store raw text strings in ChromaDB.

    Args:
        texts:           List of raw text strings (e.g., parsed PDF pages).
        metadatas:       Optional list of metadata dicts (one per text).
        collection_name: Override the default collection name.

    Returns:
        List of document IDs added to the vectorstore.
    """
    splitter = _get_text_splitter()
    vs = get_vectorstore(collection_name)

    # Build LangChain Documents
    docs: list[Document] = []
    for i, text in enumerate(texts):
        if text and text.strip():
            meta = (metadatas[i] if metadatas and i < len(metadatas) else {})
            docs.append(Document(page_content=text, metadata=meta))

    if not docs:
        logger.warning("No non-empty text content provided for Chroma ingestion.")
        return []

    # Split into chunks and keep non-empty chunks
    split_chunks = splitter.split_documents(docs)
    chunks = [c for c in split_chunks if c.page_content and c.page_content.strip()]

    if not chunks:
        logger.warning("No non-empty chunks to ingest after document splitting.")
        return []

    logger.info("Ingesting %d chunks (%d source docs) into Chroma …", len(chunks), len(docs))

    ids = vs.add_documents(chunks)
    logger.info("Ingested %d chunks successfully.", len(ids))
    return ids


def query_documents(
    query: str,
    collection_name: str | None = None,
    n_results: int = DEFAULT_TOP_K,
) -> list[dict[str, Any]]:
    """
    Perform a semantic similarity search against the ChromaDB collection.

    Args:
        query:           Natural-language query string.
        collection_name: Override the default collection name.
        n_results:       Number of nearest neighbours to return.

    Returns:
        List of result dicts with 'content', 'metadata', and 'score'.
    """
    vs = get_vectorstore(collection_name)
    logger.info("Querying Chroma (k=%d): %s", n_results, query[:80])

    results = vs.similarity_search_with_relevance_scores(query, k=n_results)

    return [
        {
            "content": doc.page_content,
            "metadata": doc.metadata,
            "score": float(score),
        }
        for doc, score in results
    ]
