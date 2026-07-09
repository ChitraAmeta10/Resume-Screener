"""Shared test fixtures.

Environment is configured for a fully offline run: SQLite, in-memory cache,
mock LLM. Each test gets a freshly reset database and cleared caches.
"""
from __future__ import annotations

import os

# Must be set BEFORE importing app modules (settings are read at import time).
os.environ.setdefault("ENV", "test")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_resume_screener.db")
os.environ.setdefault("AUTO_CREATE_TABLES", "false")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("UPLOAD_DIR", "./.test_uploads")

import mongomock  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app.models  # noqa: F401,E402  -- register models
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services.cache import get_cache  # noqa: E402
from app.services.documents import (  # noqa: E402
    ResumeDocumentStore,
    reset_document_store,
    set_document_store,
)
from app.services.llm.factory import get_llm_provider  # noqa: E402


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    get_cache.cache_clear()          # fresh in-memory cache per test
    get_llm_provider.cache_clear()   # fresh provider per test
    # In-memory MongoDB (no server) so the document-store code path is exercised.
    mongo_col = mongomock.MongoClient()["test"]["resume_documents"]
    set_document_store(ResumeDocumentStore(mongo_col))
    with TestClient(app) as c:
        yield c
    reset_document_store()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _register_and_token(client, email: str, password: str, role: str = "recruiter") -> str:
    client.post(
        "/v1/auth/register",
        json={"email": email, "password": password, "role": role},
    )
    resp = client.post("/v1/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


@pytest.fixture
def recruiter_headers(client) -> dict:
    token = _register_and_token(client, "recruiter@example.com", "password1", "recruiter")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client) -> dict:
    token = _register_and_token(client, "admin@example.com", "password1", "admin")
    return {"Authorization": f"Bearer {token}"}
