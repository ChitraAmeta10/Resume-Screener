from __future__ import annotations

from typing import List, Optional

import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (
        # One score row per (candidate, job) pair; re-scoring updates it in place.
        UniqueConstraint("candidate_id", "job_id", name="uq_score_candidate_job"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        GUID, ForeignKey("candidates.id", ondelete="CASCADE"), index=True, nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        GUID, ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )

    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0..1
    llm_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)         # 0..100
    llm_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    final_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)       # 0..100

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    candidate: Mapped["Candidate"] = relationship(back_populates="scores")  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Score final={self.final_score:.1f}>"
