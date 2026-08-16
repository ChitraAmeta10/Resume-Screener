# Resume Screener
https://resume-screener-1ugv.vercel.app

An **AI-powered resume-screening platform**. Upload resumes against a job, and it parses
each one, extracts a structured profile, scores candidates on real fit (embeddings +
LLM judgement), and ranks them into a shortlist — with skill-gap analysis, a hiring
pipeline, and role-based dashboards.

**Stack:** FastAPI · React + TypeScript · PostgreSQL · MongoDB · SQLAlchemy · Alembic · JWT/RBAC · pytest

> Runs **fully offline with zero setup** (SQLite + a built-in mock LLM), or in a
> **production configuration** (PostgreSQL + MongoDB + a real LLM) — switched entirely
> through environment variables, no code changes.

---

## Table of contents
- [What it does](#what-it-does)
- [Features](#features)
- [Architecture](#architecture)
- [How the AI works](#how-the-ai-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Roles & access control](#roles--access-control)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Design decisions](#design-decisions)

---

## What it does

A recruiter creates a **job** (pasting the description). The app extracts the required
skills. They then **upload resumes** (PDF / DOCX / TXT). For each resume the system:

1. **Extracts the text** from the file.
2. **Structures it** into a validated profile (name, email, skills, experience, education)
   using an LLM with a schema-validation retry loop.
3. **Scores the fit** by blending an embedding-similarity signal with an LLM's holistic
   judgement, producing a 0–100 score plus a short reasoning string.
4. **Ranks** all candidates into a shortlist, shows **which required skills each candidate
   has vs. is missing**, and lets the recruiter move candidates through a **hiring
   pipeline** (New → Screened → Interview → Offer → Rejected).

Everything is visible in a **React dashboard** — KPIs, fit distribution, a searchable
talent pool, and a Kanban pipeline board.

---

## Features

**Screening & AI**
- Resume parsing from **PDF, DOCX, TXT**
- **Structured extraction** into a strict schema, with automatic retry on validation failure
- **Hybrid scoring** = embedding similarity + LLM judgement, with explainable reasoning
- **Skill-gap matching** — matched ✓ / missing ✕ against the job's required skills
- Tunable scoring weights (live re-ranking), sort/filter, **CSV export**

**Workflow**
- **Hiring pipeline stages** with a Kanban board
- **Talent pool** — searchable list of every candidate across jobs (server-side search)
- **Role-aware dashboards** — admins get an org-wide team view; recruiters get their own
- Job CRUD, résumé document viewer

**Engineering**
- **JWT auth + role-based access control** (owner-scoped queries)
- **Polyglot persistence** — PostgreSQL (relational core) + MongoDB (résumé documents)
- **Pluggable LLM provider** (mock / OpenAI / Anthropic) behind one interface
- **Alembic migrations**, **46 automated tests** (pytest)
- Decoupled **React + TypeScript** SPA over a REST API

---

## Architecture

```
                    ┌──────────────────────────────┐
                    │   React + TypeScript (Vite)   │   ← frontend-react/
                    │  dashboard · pool · pipeline  │
                    └───────────────┬──────────────┘
                                    │  REST /v1 (JWT)
                    ┌───────────────▼──────────────┐
                    │         FastAPI backend       │   ← backend/app/
                    │  api → services → models      │
                    │  auth · jobs · resumes ·      │
                    │  candidates · dashboard       │
                    └───┬───────────┬───────────┬───┘
                        │           │           │
         ┌──────────────▼──┐  ┌─────▼─────┐  ┌──▼──────────────┐
         │  PostgreSQL      │  │  MongoDB  │  │  LLM provider    │
         │  users, jobs,    │  │  raw      │  │  mock / OpenAI / │
         │  candidates,     │  │  résumé   │  │  Anthropic       │
         │  scores, stages  │  │  documents│  │  (+ embeddings)  │
         └──────────────────┘  └───────────┘  └─────────────────┘
```

**Layered backend:** `api/` (HTTP routes) → `services/` (business logic: extraction,
scoring, embeddings, cache, document store, LLM) → `models/` (SQLAlchemy) + `schemas/`
(Pydantic).

**Polyglot persistence:** the **relational, transactional data** (users, jobs, candidates,
scores, pipeline stages, RBAC) lives in **PostgreSQL**; the **unstructured résumé
artifacts** (raw text + the full LLM extraction JSON) live in **MongoDB**, where a flexible
document model fits naturally. Both sit behind small abstractions, and each has a graceful
fallback (SQLite for the DB; the relational text column when Mongo is disabled).

---

## How the AI works

### 1. Structured extraction (the core pattern)
LLMs don't reliably emit schema-perfect JSON, so extraction is a **validate-and-retry loop**:

```
LLM call → parse JSON → validate against a strict Pydantic schema
        → on failure, feed the validation error back into the prompt and retry
```

See [`backend/app/services/extractor.py`](backend/app/services/extractor.py). This makes
extraction robust instead of hoping the model behaves.

### 2. Hybrid scoring
```
final = SIMILARITY_WEIGHT · (cosine_similarity × 100) + LLM_WEIGHT · llm_score
```
- **similarity** — cosine similarity between the job description and the résumé
  (embeddings; see [`embeddings.py`](backend/app/services/embeddings.py))
- **llm_score** — an LLM's 0–100 holistic judgement + a short reasoning string
- Results are **cached** per `(job_id, candidate_id)` to avoid recomputation.

See [`backend/app/services/scorer.py`](backend/app/services/scorer.py).

### 3. Skill-gap matching
Required skills (extracted from the job) are matched case-insensitively against each
candidate's extracted skills to produce matched / missing lists and a coverage ratio.

> **Note on the offline defaults:** out of the box the LLM is a deterministic **mock** and
> embeddings use a lightweight hashing trick — so the whole pipeline runs with no API keys.
> Set a real provider/model via env to use actual models; the abstraction makes it a drop-in.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | FastAPI, Python 3.12 |
| **Relational DB** | PostgreSQL (SQLite for local/offline) via SQLAlchemy 2 + Alembic |
| **Document DB** | MongoDB via PyMongo (raw résumé artifacts) |
| **Auth** | JWT (PyJWT) + bcrypt password hashing + role-based access control |
| **AI** | Pluggable LLM provider (mock / OpenAI / Anthropic); offline embeddings |
| **Parsing** | pdfplumber (PDF), python-docx (DOCX) |
| **Testing** | pytest, mongomock (in-memory Mongo) — 46 tests |

---

## Getting started

### Prerequisites
- **Python 3.10+** (3.12 recommended)
- **Node.js 18+** (for the React frontend)
- *(Optional, for the full stack)* **PostgreSQL** and **MongoDB**

### Option A — Fully offline, zero setup (SQLite + mock LLM)
No database servers, no API keys.

```bash
# 1. Python env + deps
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt

# 2. Configure for offline mode (backend/.env)
#    DATABASE_URL=sqlite:///./resume_screener.db
#    LLM_PROVIDER=mock
#    (leave MONGODB_URL unset)
cp backend/.env.example backend/.env   # then edit if needed

# 3. Build the frontend (served by the API at /)
cd frontend-react && npm install && npm run build && cd ..

# 4. Run the API
cd backend && ../.venv/bin/uvicorn app.main:app --reload --port 8001
```
Open **http://localhost:8001** and register an account.

> Prefer `make`? From the repo root: `make install`, `make web-install`, `make web-build`,
> `make run`.

### Option B — Full stack (PostgreSQL + MongoDB)
```bash
# start the databases (example: Homebrew on macOS)
brew services start postgresql@14
brew services start mongodb-community
createdb resume_screener

# point backend/.env at them:
#   DATABASE_URL=postgresql+psycopg2://USER@localhost:5432/resume_screener
#   MONGODB_URL=mongodb://localhost:27017
#   MONGODB_DB=resume_screener

# create the schema, then run
cd backend && ../.venv/bin/alembic upgrade head   # or set AUTO_CREATE_TABLES=true
../.venv/bin/uvicorn app.main:app --reload --port 8001
```

### Frontend development (hot reload)
```bash
cd frontend-react && npm run dev   # Vite dev server on :5173, proxies /v1 → :8001
```

---

## Configuration

All settings are environment-driven ([`backend/app/core/config.py`](backend/app/core/config.py)).
Copy `backend/.env.example` → `backend/.env` and adjust.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./resume_screener.db` | Relational DB; use `postgresql+psycopg2://…` in prod |
| `MONGODB_URL` | *(unset)* | Enables the MongoDB résumé document store |
| `MONGODB_DB` | `resume_screener` | Mongo database name |
| `LLM_PROVIDER` | `mock` | `mock` / `openai` / `anthropic` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | *(unset)* | Key for the chosen real provider |
| `JWT_SECRET` | `change-me-in-production` | Token signing secret (set a strong value) |
| `SIMILARITY_WEIGHT` / `LLM_WEIGHT` | `0.4` / `0.6` | Hybrid-scoring blend |
| `REDIS_URL` | *(unset)* | Optional Redis cache (else in-process) |
| `CORS_ORIGINS` | `["*"]` | Allowed frontend origins |

---

## API reference

Interactive docs (Swagger) live at **`/docs`** when the server is running. Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/auth/register` | Create an account (role: recruiter/admin) |
| `POST` | `/v1/auth/login` | Get a JWT |
| `GET`  | `/v1/dashboard` | Aggregated metrics (role-aware: team vs personal) |
| `POST` | `/v1/jobs` | Create a job (auto-extracts required skills) |
| `GET`  | `/v1/jobs` | List your jobs |
| `DELETE` | `/v1/jobs/{id}` | Delete a job (cascades candidates + docs) |
| `POST` | `/v1/jobs/{id}/resumes/upload` | Upload & screen resumes |
| `GET`  | `/v1/jobs/{id}/ranked-candidates` | Ranked shortlist with scores |
| `GET`  | `/v1/jobs/{id}/skill-gap` | Per-candidate matched/missing skills |
| `GET`  | `/v1/candidates` | Talent pool across jobs (`?search=`) |
| `PATCH`| `/v1/candidates/{id}/status` | Move a candidate through the pipeline |
| `GET`  | `/v1/candidates/{id}/document` | Raw résumé document (from MongoDB) |
| `GET`  | `/v1/health` | Health check |

---

## Roles & access control

- **Registration** picks a role: `recruiter` or `admin`. The role is embedded in the JWT.
- **Recruiter** — sees and manages **only their own** jobs and candidates (owner-scoped
  queries); a personal dashboard.
- **Admin** — an **org-wide "team" dashboard** aggregating every recruiter's data, plus
  candidate-deletion rights.
- Every data query is scoped by role in the API, so a recruiter cannot access another user's
  data — enforced server-side, not just hidden in the UI.

---

## Testing

```bash
cd backend && ../.venv/bin/pytest      # 46 tests
```
Tests run fully offline: **SQLite** for the DB and **mongomock** (in-memory MongoDB) for the
document store — no servers or keys required. Coverage includes auth/RBAC, upload &
extraction, scoring, skill-gap, talent pool, pipeline status, job deletion + cascade, and the
MongoDB document store.

---

## Project structure

```
resume-screener/
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── api/                 # HTTP routes (auth, jobs, resumes, candidates, dashboard)
│   │   ├── services/            # extraction, scoring, embeddings, cache, documents, llm/
│   │   ├── models/              # SQLAlchemy models (Postgres/SQLite)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── core/                # config + security (JWT/bcrypt)
│   │   └── db/                  # engine/session, MongoDB, base
│   ├── alembic/                 # database migrations
│   ├── tests/                   # pytest suite
│   └── requirements.txt
├── frontend-react/              # React + TypeScript (Vite) SPA
│   └── src/{components, api, types, ...}
├── frontend/                    # legacy single-file UI (fallback)
├── sample_data/                 # sample resumes + job description
└── Makefile                     # install / run / test / web-build helpers
```

---

## Deployment

- **Frontend → Vercel** (perfect for the Vite SPA).
- **Backend → Render / Railway / Fly** (a normal long-lived server; simpler than serverless
  for this stateful app). See `backend/.env.production.example`.
- **Databases:** hosted **PostgreSQL** (Neon / Supabase) + **MongoDB Atlas** — both have free
  tiers. Switching is just the `DATABASE_URL` / `MONGODB_URL` env vars + `alembic upgrade head`.

---

## Design decisions

- **Offline-first defaults.** SQLite + in-process cache + mock LLM means anyone can clone and
  run it in seconds — while the same code scales to Postgres + Redis + a real LLM via env.
- **Validate-and-retry extraction.** Treats the LLM as unreliable and enforces a schema,
  which is what makes the structured output trustworthy.
- **Hybrid, explainable scoring.** Combines a cheap deterministic signal (embeddings) with an
  LLM judgement, and always returns a human-readable reason.
- **Polyglot persistence, justified.** Relational data stays relational (Postgres); résumés —
  which *are* documents — live in MongoDB. Not databases for their own sake.
- **Server-side authorization.** RBAC is enforced in the API layer, not just the UI.

---

*Built as a full-stack portfolio project demonstrating AI application/backend engineering,
polyglot persistence, and a modern React frontend.*
