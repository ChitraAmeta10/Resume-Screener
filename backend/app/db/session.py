"""Engine and session management."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=settings.sqlalchemy_connect_args,
    pool_pre_ping=True,
    future=True,
)


# SQLite ignores foreign-key constraints (and thus ON DELETE CASCADE) unless they
# are turned on per-connection. Without this, deleting a job leaves orphaned
# candidate/score rows. Postgres enforces FKs natively, so this is SQLite-only.
if settings.is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, _connection_record):  # pragma: no cover
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,  # keep attributes usable after commit inside endpoints
    class_=Session,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
