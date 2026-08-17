# PlacementPal

PlacementPal is an AI-powered placement preparation platform that combines a React/Vite frontend with a FastAPI backend to produce personalized study plans, company-specific intelligence, and active-recall practice using LangGraph, CrewAI, LangChain, and ChromaDB.

This README documents how to run the project locally, the high-level architecture, and the most important development notes.


## Architecture (high level)

Mermaid diagram (pipeline view):

```mermaid
flowchart TD
  A[Student Message] --> B(Phase 1: interpret_message)
  B --> C{Parallel}
  C --> D[company_intel (web search)]
  C --> E[knowledge_vault (Chroma retrieval)]
  D --> F(Phase 2 entry)
  E --> F
  F --> G[generate_recall]
  G --> H[curriculum_plan]
  H --> I[Plan stored in MongoDB]
  E -->|Embeddings| ChromaDB
  style ChromaDB fill:#f9f,stroke:#333,stroke-width:1px
```

## Quick start

Prerequisites:
- Python 3.10+ (project targets Python 3.12 in requirements, but 3.10+ is usually fine for local dev)
- Node.js 18+
- MongoDB (local or remote)

Backend (server):

```bash
cd server
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# or macOS / Linux
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and add keys: OPENAI_API_KEY, MONGODB_URI, CHROMA_DIRECTORY, TAVILY_API_KEY
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

Frontend (client):

```bash
cd client
npm install
npm run dev
```

Client app: http://localhost:5173
# PlacementPal 🎓🤖

**PlacementPal** is an AI-powered placement preparation platform designed to help students crack technical interviews at top-tier software companies. By orchestrating **LangGraph**, **CrewAI**, **LangChain**, and **RAG (Retrieval-Augmented Generation)** over **ChromaDB**, PlacementPal crafts highly personalized, day-by-day preparation plans, company-specific intelligence profiles, active-recall question sets, and intelligent progress tracking.

---

## 🏗️ Tech Stack

### **Backend**
* **Framework:** Python 3.12, FastAPI, Uvicorn
* **Database:** MongoDB (Async via `motor`)
* **Vector Store:** ChromaDB (Local vector database for PDF/document RAG)
* **AI Orchestration & Agents:**
  * **LangGraph:** Stateful, multi-phase execution graph pipelines
  * **CrewAI:** Autonomous multi-agent coordination (5 specialized agents)
  * **LangChain & LCEL:** Unified chains for extraction, company intelligence, recall generation, and curriculum design
* **Tools & Services:** Tavily Search API (real-time web search for company hiring trends)
* **Configuration:** Pydantic v2, Pydantic-Settings, `python-dotenv`

### **Frontend**
* **Framework:** React 18, Vite
* **Styling:** Custom Vanilla CSS with modern dark theme aesthetic

---

## 📁 Project Structure

```text
placement_pal/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py             # FastAPI App entrypoint
│   │   ├── config.py           # Pydantic environment configuration
│   │   ├── dependencies.py     # Dependency Injection & Service singletons
│   │   │
│   │   ├── api/                # Modular API Routers
│   │   │   ├── routes.py       # Aggregated V1 API router
│   │   │   ├── pipeline.py     # Execution pipeline endpoints (Phase 1 & Phase 2)
│   │   │   ├── vault.py        # Knowledge Vault & PDF ingestion endpoints
│   │   │   ├── plan.py         # Plan retrieval & update endpoints
│   │   │   └── state.py        # Session state query endpoints
│   │   │
│   │   ├── agents/             # CrewAI Specialized Agents
│   │   │   ├── message_interpreter.py   # Intent extraction agent
│   │   │   ├── company_intel.py         # Real-time hiring intel agent
│   │   │   ├── knowledge_vault.py       # RAG retrieval agent
│   │   │   ├── recall_agent.py          # Active recall & Spaced repetition coach
│   │   │   ├── curriculum_architect.py  # Day-by-day plan designer
│   │   │   └── crew.py                  # Crew factory & execution tasks
│   │   │
│   │   ├── chains/             # LangChain LCEL Chains
│   │   │   ├── extraction_chain.py      # Intent & goal extraction
│   │   │   ├── company_chain.py         # Search results synthesizer
│   │   │   ├── recall_chain.py          # Practice question generator
│   │   │   └── curriculum_chain.py      # Personalized curriculum generator
│   │   │
│   │   ├── graph/              # LangGraph Stateful Pipelines
│   │   │   ├── state_schema.py # Typed graph state definition
│   │   │   ├── nodes.py        # Async pipeline nodes
│   │   │   ├── phase1.py       # Phase 1: Intent & Intel Graph
│   │   │   └── phase2.py       # Phase 2: Recall & Curriculum Graph
│   │   │
│   │   ├── database/           # Persistence Layer
│   │   │   ├── mongodb.py      # Async Motor MongoDB connection singleton
│   │   │   ├── collections.py  # Typed collection accessors
│   │   │   └── chroma.py       # Local ChromaDB vectorstore & embedding helpers
│   │   │
│   │   ├── models/             # Pydantic v2 Schemas & Data Envelopes
│   │   ├── services/           # Service layer (Session, Vault, Planner, Company, Progress)
│   │   ├── tools/              # LangChain @tool wrappers (Tavily search, Coding/Aptitude links)
│   │   ├── data/               # Local JSON seed data (coding & aptitude links)
│   │   └── utils/              # System utilities, logger, LLM factory, prompt templates
│   │
│   ├── .env.example            # Environment variables template
│   └── requirements.txt        # Python package dependencies
│
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **MongoDB** running locally (`mongodb://localhost:27017`) or a remote MongoDB URI.
- **OpenAI API Key** (or custom base URL provided by your institution).
- **Tavily API Key** (Free key at [app.tavily.com](https://app.tavily.com)).

---

### 2. Backend Setup (`server/`)

#### **Option A: Using Standard Python `venv`**
```powershell
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### **Option B: Using Conda**
```powershell
cd server
conda create -n placement_pal python=3.12 -y
conda activate placement_pal
pip install -r requirements.txt
```

#### **Configure Environment Variables**
Copy `.env.example` to `.env` in the `server/` directory and set your credentials:
```env
# LLM Configuration
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=               # Optional: Custom institutional proxy base URL
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.0

# Real-time Web Search
TAVILY_API_KEY=tvly-...

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=placementpal_db

# Local Vector Database (ChromaDB)
CHROMA_DIRECTORY=./chroma_db
CHROMA_COLLECTION=placement_vault

# App Debug Mode
DEBUG=true
```

#### **Start Backend Server**
```powershell
uvicorn app.main:app --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger API Docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup (`client/`)

```powershell
# Open a new terminal and navigate to client
cd client

# Install packages
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🤖 AI Execution Pipeline Architecture

PlacementPal uses a two-phase stateful graph execution pipeline implemented in **LangGraph**:

```
                  ┌───────────────────────────────────────────────┐
                  │            Student Message Input              │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Phase 1: Intent & Intel Pipeline   │
                      └───────────────────┬───────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌──────────────────────┐                      ┌──────────────────────┐
       │   Company Intelligence│                      │   Knowledge Vault    │
       │    (Tavily Search)   │                      │  (ChromaDB RAG Docs) │
       └───────────┬──────────┘                      └───────────┬──────────┘
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │   Phase 2: Recall & Curriculum Plan   │
                      └───────────────────┬───────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌──────────────────────┐                      ┌──────────────────────┐
       │    Active Recall     │                      │ Day-by-Day Study Plan│
       │ Question Generation  │                      │   Curriculum Design  │
       └──────────────────────┘                      └──────────────────────┘
```

---

## 🔌 Main API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/pipeline/phase1` | Runs Phase 1 (Intent extraction, Tavily search, Knowledge Vault lookup) |
| `POST` | `/api/v1/pipeline/phase2` | Runs Phase 2 (Active recall generation & Day-by-day curriculum creation) |
| `POST` | `/api/v1/vault/upload` | Uploads PDF/Text study materials, chunks and embeds into local ChromaDB |
| `GET`  | `/api/v1/vault/query` | Semantic similarity search across local ChromaDB vault |
| `GET`  | `/api/v1/vault/topics` | List structured preparation topics stored in MongoDB |
| `POST` | `/api/v1/vault/topics` | Create a new study topic entry |
| `GET`  | `/api/v1/plan/{session_id}` | Fetch generated preparation plan for a session |
| `PUT`  | `/api/v1/plan/{session_id}/task` | Update task progress status (Completed / Pending) |
| `GET`  | `/api/v1/state/{session_id}` | Retrieve current session state and timeline |

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for details.
