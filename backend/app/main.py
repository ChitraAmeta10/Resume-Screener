"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import app.models  # noqa: F401  -- register models with Base.metadata
from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.logging_config import configure_logging

configure_logging()
logger = logging.getLogger("resume_screener")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)
    logger.info(
        "Resume Screener started (env=%s, llm=%s, db=%s)",
        settings.ENV,
        settings.LLM_PROVIDER,
        "sqlite" if settings.is_sqlite else "postgres",
    )
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "AI-powered resume parsing, structured extraction, scoring, and candidate "
        "ranking. See `/docs` for the interactive API."
    ),
    lifespan=lifespan,
)

# The app authenticates with Bearer tokens (not cookies), so credentials aren't
# needed. Browsers also reject the `allow_origins=["*"]` + credentials combo, so
# only enable credentials when specific origins are configured (e.g. the Vercel URL).
_allow_all_origins = settings.CORS_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=not _allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.exception("Global unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    from fastapi.responses import JSONResponse

    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc) or repr(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Frontend. Prefer the built React app (frontend-react/dist); fall back to the
# legacy single-file vanilla UI (frontend/index.html) if it isn't built yet.
# This file is <root>/backend/app/main.py, so parents[2] is the project root.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_REACT_DIST = _PROJECT_ROOT / "frontend-react" / "dist"
_LEGACY_FRONTEND = _PROJECT_ROOT / "frontend"

# Vite emits hashed assets under /assets — mount them when the build exists.
if (_REACT_DIST / "assets").is_dir():
    app.mount(
        "/assets", StaticFiles(directory=_REACT_DIST / "assets"), name="assets"
    )


def _index_file() -> Path | None:
    for candidate in (_REACT_DIST / "index.html", _LEGACY_FRONTEND / "index.html"):
        if candidate.exists():
            return candidate
    return None


@app.get("/", include_in_schema=False)
def root():
    """Serve the built web UI (React build preferred), else basic API info."""
    index = _index_file()
    if index is not None:
        return FileResponse(index)
    return {
        "name": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
