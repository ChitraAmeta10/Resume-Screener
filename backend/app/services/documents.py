"""Resume document store (MongoDB).

Polyglot persistence: the relational DB (Postgres/SQLite) holds the *structured*
hiring data — users, jobs, candidates, scores, pipeline stages — while the raw,
unstructured resume artifacts live in MongoDB, where a flexible document model
fits naturally:

    { candidate_id, job_id, filename, raw_text, profile: {...extraction JSON...},
      created_at }

If ``MONGODB_URL`` is not configured the store is a no-op, and the app falls back
to the ``raw_resume_text`` column in the relational DB — so local dev still runs
with zero external services.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger("resume_screener.documents")

_COLLECTION = "resume_documents"


class ResumeDocumentStore:
    """Thin wrapper over a MongoDB collection of resume documents."""

    def __init__(self, collection: Any | None) -> None:
        self._col = collection

    @property
    def enabled(self) -> bool:
        return self._col is not None

    def save(
        self,
        *,
        candidate_id: uuid.UUID,
        job_id: uuid.UUID,
        filename: str,
        raw_text: str,
        profile: dict,
    ) -> None:
        if self._col is None:
            return
        try:
            self._col.update_one(
                {"candidate_id": str(candidate_id)},
                {
                    "$set": {
                        "candidate_id": str(candidate_id),
                        "job_id": str(job_id),
                        "filename": filename,
                        "raw_text": raw_text,
                        "profile": profile,
                        "created_at": datetime.now(timezone.utc),
                    }
                },
                upsert=True,
            )
        except Exception as exc:  # non-critical: the relational copy still exists
            logger.warning("mongo save failed for candidate %s: %s", candidate_id, exc)

    def get(self, candidate_id: uuid.UUID) -> Optional[dict]:
        if self._col is None:
            return None
        try:
            doc = self._col.find_one(
                {"candidate_id": str(candidate_id)}, {"_id": False}
            )
            return doc
        except Exception as exc:
            logger.warning("mongo get failed for candidate %s: %s", candidate_id, exc)
            return None

    def delete(self, candidate_ids: list[uuid.UUID]) -> None:
        if self._col is None or not candidate_ids:
            return
        try:
            self._col.delete_many(
                {"candidate_id": {"$in": [str(c) for c in candidate_ids]}}
            )
        except Exception as exc:
            logger.warning("mongo delete failed: %s", exc)


_store: Optional[ResumeDocumentStore] = None


def _build_collection() -> Any | None:
    """Create the MongoDB collection handle, or None if Mongo is disabled."""
    if not settings.mongo_enabled:
        return None
    from pymongo import ASCENDING, MongoClient

    client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
    col = client[settings.MONGODB_DB][_COLLECTION]
    col.create_index([("candidate_id", ASCENDING)], unique=True)
    return col


def get_document_store() -> ResumeDocumentStore:
    """Return the process-wide resume document store (lazily initialised)."""
    global _store
    if _store is None:
        _store = ResumeDocumentStore(_build_collection())
    return _store


def set_document_store(store: ResumeDocumentStore) -> None:
    """Override the store — used by tests to inject a mongomock-backed collection."""
    global _store
    _store = store


def reset_document_store() -> None:
    global _store
    _store = None
