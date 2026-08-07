# PlacementPal – Backend API

> **AI-powered placement preparation platform** built with FastAPI, LangGraph, CrewAI, LangChain, MongoDB, and ChromaDB.

---

## 📖 Project Overview

PlacementPal is an intelligent backend system that guides students through their entire tech-placement preparation journey. It combines:

- **LangGraph** multi-phase agentic pipelines for structured AI reasoning
- **CrewAI** specialised agents (message interpreter, company intel, curriculum architect, etc.)
- **LangChain** chains for prompt-driven extraction, recall, and curriculum generation
- **ChromaDB** for semantic search over personalised study materials
- **MongoDB (Motor)** for persistent session, progress, and vault storage
- **FastAPI** for a clean, fully documented REST API

---

## 🏗 Architecture

```
Client Request
     │
     ▼
FastAPI (main.py)
     │
     ├── /api/v1/pipeline  ──► LangGraph Phase-1 / Phase-2
     │                              │
     │                     ┌────────┴────────┐
     │                  Phase 1           Phase 2
     │            interpret_message    generate_recall
     │            company_intel  ──►  curriculum_plan
     │            knowledge_vault
     │
     ├── /api/v1/vault     ──► ChromaDB + MongoDB
     ├── /api/v1/plan      ──► PlannerService + MongoDB
     └── /api/v1/state     ──► SessionService + MongoDB

CrewAI Agents (initialised, not yet executed):
  MessageInterpreter → CompanyIntel → KnowledgeVault
  RecallAgent → CurriculumArchitect

LangChain Chains (stubs):
  ExtractionChain → RecallChain → CurriculumChain → CompanyChain
```

---

## 📂 Folder Structure

```
server/
│
├── app/
│   ├── main.py              # FastAPI app factory, middleware, lifecycle
│   ├── config.py            # Pydantic-settings configuration
│   ├── dependencies.py      # FastAPI DI helpers
│   │
│   ├── api/
│   │   ├── routes.py        # Aggregated router (/api/v1)
│   │   ├── pipeline.py      # POST /pipeline/phase1, /phase2
│   │   ├── vault.py         # POST /vault/upload, /query, /topics
│   │   ├── plan.py          # POST /plan/mark-task, /advance-day
│   │   └── state.py         # GET /state
│   │
│   ├── database/
│   │   ├── mongodb.py       # Motor singleton client
│   │   ├── chroma.py        # ChromaDB persistent client helpers
│   │   └── collections.py   # Named collection accessors
│   │
│   ├── models/
│   │   ├── state.py         # PlacementState (Pydantic v2)
│   │   ├── topic.py         # TopicEntry, TaskItem
│   │   ├── request_models.py
│   │   └── response_models.py
│   │
│   ├── graph/
│   │   ├── state_schema.py  # LangGraph TypedDict channels
│   │   ├── nodes.py         # All node functions (stubs with TODOs)
│   │   ├── edges.py         # Routing / edge functions
│   │   ├── phase1.py        # Phase-1 compiled graph
│   │   └── phase2.py        # Phase-2 compiled graph
│   │
│   ├── agents/
│   │   ├── message_interpreter.py
│   │   ├── company_intel.py
│   │   ├── knowledge_vault.py
│   │   ├── recall_agent.py
│   │   ├── curriculum_architect.py
│   │   └── crew.py          # PlacementPalCrew factory
│   │
│   ├── chains/
│   │   ├── extraction_chain.py
│   │   ├── recall_chain.py
│   │   ├── curriculum_chain.py
│   │   └── company_chain.py
│   │
│   ├── services/
│   │   ├── session_service.py
│   │   ├── vault_service.py
│   │   ├── planner_service.py
│   │   ├── company_service.py
│   │   └── progress_service.py
│   │
│   ├── tools/
│   │   ├── coding_links.py
│   │   ├── aptitude_links.py
│   │   ├── web_scraper.py
│   │   └── topic_tools.py
│   │
│   ├── utils/
│   │   ├── logger.py
│   │   ├── helpers.py
│   │   ├── constants.py
│   │   └── prompts.py
│   │
│   ├── data/
│   │   ├── coding_links.json
│   │   ├── aptitude_links.json
│   │   └── mock_company_data.json
│   │
│   └── uploads/             # User-uploaded files (git-ignored)
│
├── chroma_db/               # ChromaDB persistent store (git-ignored)
├── tests/                   # Test suite
├── .env.example
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 1. Clone & navigate

```bash
git clone <repo-url>
cd placement_pal/server
```

### 2. Create a virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your values:
#   OPENAI_API_KEY, MONGODB_URI, DATABASE_NAME, CHROMA_DIRECTORY, DEBUG
```

### 5. Start MongoDB

Make sure a MongoDB instance is running locally (default: `mongodb://localhost:27017`)
or point `MONGODB_URI` at your Atlas cluster.

---

## 🚀 Run Commands

### Development server (hot-reload)

```bash
uvicorn app.main:app --reload
```

### With custom host / port

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Documentation

| Interface | URL |
|-----------|-----|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |
| Health Check | http://localhost:8000/health |

---

## 🌐 API Endpoints

All routes are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/pipeline/phase1` | Run Phase-1 (interpret → company intel + vault retrieval) |
| `POST` | `/pipeline/phase2` | Run Phase-2 (recall generation → curriculum planning) |
| `POST` | `/vault/upload` | Upload a document to the knowledge vault |
| `POST` | `/vault/query` | Semantic search against the vault |
| `POST` | `/vault/topics` | Add a topic to the vault |
| `DELETE` | `/vault/topics/{id}` | Remove a topic |
| `POST` | `/plan/mark-task` | Update a task's completion status |
| `POST` | `/plan/advance-day` | Advance the active study day |
| `GET` | `/state` | Retrieve current session state |

---

## 🔮 Future Work

- [ ] Implement `interpret_message_node` using `ExtractionChain` + `MessageInterpreterAgent`
- [ ] Implement `company_intel_node` with `web_scraper` + `CompanyChain`
- [ ] Implement `knowledge_vault_node` with ChromaDB semantic search
- [ ] Implement `generate_recall_node` with `RecallChain`
- [ ] Implement `curriculum_plan_node` with `CurriculumChain`
- [ ] Wire up all `NotImplementedError` service methods
- [ ] Add JWT / OAuth2 authentication
- [ ] Add WebSocket support for real-time pipeline progress streaming
- [ ] Add comprehensive test suite (pytest + httpx AsyncClient)
- [ ] Add Docker / docker-compose setup
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Implement rate limiting middleware
- [ ] Add MongoDB indexes for session_id and company_name fields
- [ ] Add Prometheus metrics endpoint
