"""Declarative base. Kept import-light to avoid circular imports.

Model modules import ``Base`` from here. To make sure every model is registered
with ``Base.metadata`` (needed for ``create_all`` and Alembic autogenerate),
import the ``app.models`` package, whose ``__init__`` imports all models.
"""
from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
