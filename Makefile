.RECIPEPREFIX = >
.PHONY: help install run test demo sample-data migrate revision up down clean web-install web-build web-dev

# Backend Python code lives in ./backend (absolute ``app.*`` imports → run from backend/).
# The React frontend lives in ./frontend-react and builds to ./frontend-react/dist,
# which the API serves at "/". (./frontend is the legacy vanilla single-file UI.)
BE = backend
WEB = frontend-react

help:
> @echo "Targets:"
> @echo "  install      Install Python dependencies"
> @echo "  run          Run the API locally with autoreload (SQLite + mock LLM)"
> @echo "  test         Run the test suite"
> @echo "  web-install  Install the React frontend's npm dependencies"
> @echo "  web-build    Build the React frontend (served by the API at /)"
> @echo "  web-dev      Run the Vite dev server with HMR (proxies /v1 to :8001)"
> @echo "  demo         Run the end-to-end demo in-process (no server needed)"
> @echo "  sample-data  Generate sample resumes + job description"
> @echo "  migrate      Apply Alembic migrations (alembic upgrade head)"
> @echo "  revision m=  Autogenerate a migration:  make revision m='add table'"
> @echo "  up           docker compose up --build (Postgres + Redis + API)"
> @echo "  down         docker compose down"
> @echo "  clean        Remove local DBs, caches, uploads"

web-install:
> cd $(WEB) && npm install

web-build:
> cd $(WEB) && npm run build

web-dev:
> cd $(WEB) && npm run dev

install:
> cd $(BE) && pip install -r requirements.txt

run:
> cd $(BE) && uvicorn app.main:app --reload

test:
> cd $(BE) && pytest

demo:
> cd $(BE) && python scripts/demo.py

sample-data:
> cd $(BE) && python scripts/generate_sample_data.py

migrate:
> cd $(BE) && alembic upgrade head

revision:
> cd $(BE) && alembic revision --autogenerate -m "$(m)"

up:
> docker compose up --build

down:
> docker compose down

clean:
> rm -f $(BE)/*.db
> rm -rf $(BE)/uploads $(BE)/.test_uploads $(BE)/.pytest_cache
> find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
