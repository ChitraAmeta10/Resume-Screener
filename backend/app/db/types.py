"""Portable column types that work on both PostgreSQL and SQLite.

- ``GUID``   -> native ``UUID`` on Postgres, ``CHAR(36)`` on SQLite.
- ``JSONType`` -> ``JSONB`` on Postgres, generic ``JSON`` elsewhere.

This lets the exact same models run against SQLite locally / in tests and
Postgres in production without conditional code sprinkled through the models.
"""
from __future__ import annotations

import uuid
from typing import Any, Optional

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, JSON, TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent UUID type."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value: Optional[Any], dialect) -> Optional[Any]:
        if value is None:
            return None
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value: Optional[Any], dialect) -> Optional[uuid.UUID]:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


# JSONB on Postgres, plain JSON everywhere else.
JSONType = JSON().with_variant(JSONB(), "postgresql")
