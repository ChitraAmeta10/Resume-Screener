"""Top-level API router aggregating all sub-routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.api import auth, candidates, dashboard, jobs, resumes

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(resumes.router)
api_router.include_router(candidates.router)
api_router.include_router(dashboard.router)
