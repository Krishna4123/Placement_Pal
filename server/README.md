# PlacementPal – Backend API

This document focuses on the backend `server/` and the commands needed to run and develop it locally.

## Quick start (server)

```bash
cd server
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# or macOS / Linux
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# update .env with your OPENAI_API_KEY, MONGODB_URI, etc.
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Important locations

- App entry: `server/app/main.py` — FastAPI app factory, CORS, lifecycle hooks.
- Routers: `server/app/api/routes.py` — includes pipeline, vault, plan, state, parse, chat, auth.
- Graphs: `server/app/graph/phase1.py`, `server/app/graph/phase2.py` — LangGraph definitions.
- Services: `server/app/services/` — business logic (session_service, vault_service, planner_service).
- Database helpers: `server/app/database/` — Mongo (motor) and Chroma helpers.

## API (summary)

All routes are prefixed with `/api/v1`.

- `POST /pipeline/phase1` — Run Phase-1 (interpret → company_intel + vault retrieval)
- `POST /pipeline/phase2` — Run Phase-2 (generate_recall → curriculum_plan)
- `POST /vault/upload` — Upload and ingest a document to the knowledge vault
- `POST /vault/query` — Semantic search + strict RAG answer from vault
- `POST /plan/mark-task` — Change a task status
- `GET /state/{session_id}` — Retrieve session state

## Notes & TODOs

- Many LangGraph node implementations and LangChain chain logic are currently scaffolds and need completion (see `server/app/graph/` and `server/app/chains/`).
- Security: CORS is permissive in development; authentication endpoints exist but require review.
- Tests and Docker support are TODO items.

