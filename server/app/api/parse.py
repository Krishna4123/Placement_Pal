from __future__ import annotations
import re
import logging
from datetime import datetime
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.models.response_models import APIResponse
from app.services.session_service import SessionService

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])
logger = logging.getLogger(__name__)
session_service = SessionService()


class ParseRequest(BaseModel):
    session_id: str
    notification_text: str


def _clean_company(name: str) -> str:
    name = re.sub(r"^(?:M/[sS]\.?\s*|M\.?s\.?\s*|Mr\.?\s*|Mrs\.?\s*|Dr\.?\s*)", "", name).strip()
    return re.sub(r"\s+", " ", name).strip()


def _try_parse_date(raw: str):
    try:
        from dateutil import parser as dp
        return dp.parse(raw, fuzzy=False, dayfirst=True)
    except Exception:
        pass
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y",
                "%d %b %Y", "%d %B %Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            pass
    return None


def _regex_parse(text: str) -> dict[str, Any]:
    today = datetime.now().date()
    company = None
    m = re.search(r"Company\s+Name\s*[:\-]\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if m:
        company = _clean_company(m.group(1).strip().split("Website")[0].strip())
    if not company:
        m2 = re.search(r"\bby\s+([A-Z][A-Za-z0-9&]+(?:\s+[A-Z][A-Za-z0-9&]+){0,2})\b", text)
        if m2:
            company = _clean_company(m2.group(1).strip())
    role = None
    m = re.search(r"(?:Job\s+Role|Role|Position|Designation)\s*[:\-]\s*([^\n]+)", text, re.IGNORECASE)
    if m:
        role = re.sub(r"^[\-*\s]+", "", m.group(1)).strip()
    interview_date = None
    deadline_date = None
    dl_m = re.search(r"(?:Deadline|Last\s+Date|Apply\s+By)\s*[:\-]?\s*([0-9/\w\s,]+?)(?:\s*\n|$)", text, re.IGNORECASE)
    if dl_m:
        raw = re.sub(r"[^\d/\-\s\w,]", "", dl_m.group(1)).strip()
        dt = _try_parse_date(raw)
        if dt and dt.year >= 2025:
            deadline_date = dt.strftime("%Y-%m-%d")
    effective_date_str = interview_date or deadline_date
    prep_days = 14
    if effective_date_str:
        dt = _try_parse_date(effective_date_str)
        if dt:
            diff = (dt.date() - today).days
            prep_days = max(diff, 1)
    rounds: list[str] = []
    sel_m = re.search(r"Selection\s+Process\s*:?\s*\n(.*?)(?=\n\d+\.|$)", text, re.IGNORECASE | re.DOTALL)
    if sel_m:
        items = re.findall(r"^[\s\-*]*([A-Za-z][A-Za-z\s\(\)&/\-]{3,60}?)\s*$", sel_m.group(1), re.MULTILINE)
        skip = {"venue", "audio", "visual", "t&p", "lab", "block", "auditorium"}
        for item in items:
            item = item.strip()
            if item and len(item) > 3 and not any(sw in item.lower() for sw in skip) and not re.match(r"^[A-Z]{2,5}$", item):
                rounds.append(item)
    known_tech = ["Node.js","React.js","React","JavaScript","TypeScript","Python","Java","C++","C#","Go","AWS","Docker","Django","FastAPI","MySQL","PostgreSQL","MongoDB","Redis","Git"]
    tech_stack = [t for t in known_tech if t.lower() in text.lower()][:10]
    return {"company": company, "target_role": role, "interview_date": interview_date,
            "deadline_date": deadline_date, "preparation_duration_days": prep_days,
            "process_rounds": rounds, "tech_stack": tech_stack,
            "stipend": None, "location": None, "eligibility": None, "ctc": None,
            "overview": None, "tips": []}


@router.post("/parse-notification", summary="Parse placement notification")
async def parse_notification(body: ParseRequest) -> APIResponse[dict[str, Any]]:
    text = body.notification_text.strip()
    if not text:
        return APIResponse(success=False, message="Empty notification text", data={})
    parsed: dict[str, Any] = {}
    source = "regex"
    try:
        from app.chains.notification_parser_chain import run_notification_parser
        result = await run_notification_parser(text)
        if result:
            parsed = result
            source = "gemini"
            logger.info("Notification parsed by Gemini.")
    except Exception as e:
        logger.warning("Gemini parse failed: %s", e)
    if not parsed:
        parsed = _regex_parse(text)
        logger.info("Notification parsed by regex fallback.")
    effective_date = parsed.get("interview_date") or parsed.get("deadline_date")
    company = parsed.get("company")
    role = parsed.get("target_role")
    rounds = parsed.get("process_rounds", [])
    prep_days = parsed.get("preparation_duration_days", 14)
    overview = parsed.get("overview")
    tips = parsed.get("tips")
    if company and (not overview or not tips):
        try:
            from app.chains.notification_parser_chain import generate_company_intel_with_gemini
            gen_intel = await generate_company_intel_with_gemini(company)
            if gen_intel:
                overview = gen_intel.get("overview") or overview
                tips = gen_intel.get("tips") or tips
        except Exception as e:
            logger.warning("Company intel generation failed: %s", e)
    if not overview:
        overview = [
            f"{company} is a leading technology company." if company else "Target company profile.",
            "Operates on a high-scale, modern software architecture.",
            "Focuses on delivering customer-centric solutions.",
            "Known for hiring passionate engineers.",
            "Provides great learning opportunities.",
        ]
    elif isinstance(overview, str):
        overview = [overview]
    if not tips or len(tips) < 5:
        default_tips = [
            "Practice core CS fundamentals (DSA, DBMS, OS).",
            "Be prepared to explain your projects clearly.",
            "Understand the company domain and key features.",
            "Optimize code for time and space complexity.",
            "Prepare clear answers for behavioral and HR questions.",
        ]
        tips = ((tips or []) + default_tips)[:5]
    company_intel: dict[str, Any] = {}
    if company:
        company_intel[company] = {
            "company_name": company, "overview": overview,
            "tech_stack": parsed.get("tech_stack", []),
            "common_topics": parsed.get("tech_stack", []),
            "past_interview_experiences": [], "tips": tips,
        }
    parsed["overview"] = overview
    parsed["tips"] = tips
    interpreted_intent: dict[str, Any] = {
        "target_companies": [company] if company else [],
        "target_roles": [role] if role else [],
        "interview_date": effective_date,
        "preparation_duration_days": prep_days,
        "process_rounds": rounds, "skill_gaps": [],
        "current_skills": parsed.get("tech_stack", []),
        "preferences": {"study_hours_per_day": 4.0},
    }
    try:
        existing = await session_service.get_session(body.session_id)
        if not existing:
            await session_service.create_session(body.session_id)
        now_dt = datetime.utcnow()
        await session_service.update_session(body.session_id, {
            "interpreted_intent": interpreted_intent,
            "target_companies": [company] if company else [],
            "target_roles": [role] if role else [],
            "preparation_duration_days": prep_days,
            "company_intel": company_intel,
            "parsed_notification": parsed,
            "created_at": now_dt,
            "updated_at": now_dt,
        })
        logger.info("Parsed notification saved to session %s", body.session_id)
    except Exception as e:
        logger.warning("Could not persist to MongoDB: %s", e)
    return APIResponse(
        success=True,
        message=f"Parsed via {source}: company={company!r}, role={role!r}, rounds={len(rounds)}",
        data=parsed,
    )
