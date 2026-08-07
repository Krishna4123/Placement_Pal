"""
app/services/company_service.py
─────────────────────────────────
Service layer for company intelligence operations.

Caches company research in MongoDB to avoid redundant LLM calls.
"""

from __future__ import annotations

from typing import Any, Optional


class CompanyService:
    """Fetches, summarises, and caches company placement data."""

    async def get_company_intel(self, company_name: str) -> Optional[dict[str, Any]]:
        """
        Return cached company data if available; else trigger scraping + LLM.

        TODO:
            - Check 'company_cache' collection for existing entry.
            - If not found, call web_scraper.py to fetch data.
            - Run company_chain to summarise.
            - Cache result in MongoDB with TTL.
        """
        raise NotImplementedError("get_company_intel is not implemented.")

    async def refresh_company_intel(self, company_name: str) -> dict[str, Any]:
        """
        Force-refresh the company cache (ignores existing cache).

        TODO:
            - Delete existing cache entry.
            - Re-fetch and re-summarise.
        """
        raise NotImplementedError("refresh_company_intel is not implemented.")

    async def list_cached_companies(self) -> list[str]:
        """
        Return a list of all company names with cached intel.

        TODO: query 'company_cache' collection.
        """
        raise NotImplementedError("list_cached_companies is not implemented.")
