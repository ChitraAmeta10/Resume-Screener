from __future__ import annotations

from typing import List, Optional

import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID, JSONType


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        GUID, ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Structured fields produced by the LLM extractor + Pydantic validation.
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    skills: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    experience_years: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    education: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)

    # Hiring-pipeline stage: one of new | screened | interview | offer | rejected.
    status: Mapped[str] = mapped_column(
        String(20), default="new", server_default="new", nullable=False, index=True
    )

    # Raw material for re-processing / auditing.
    raw_resume_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_file_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    job: Mapped["Job"] = relationship(back_populates="candidates")  # noqa: F821
    scores: Mapped[List["Score"]] = relationship(  # noqa: F821
        back_populates="candidate", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Candidate {self.full_name}>"
