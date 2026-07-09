from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# Ordered hiring-pipeline stages a candidate moves through.
CANDIDATE_STATUSES = ("new", "screened", "interview", "offer", "rejected")
CandidateStatus = Literal["new", "screened", "interview", "offer", "rejected"]


# ---------------------------------------------------------------------------
# The strict schema the LLM MUST conform to during structured extraction.
# The extractor validates raw LLM output against this and RETRIES with the
# validation error fed back into the prompt if it doesn't conform.
# ---------------------------------------------------------------------------
class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[int] = Field(default=None, ge=1900, le=2100)


class CandidateProfile(BaseModel):
    """Canonical structured representation of a resume."""

    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=64)
    skills: list[str] = Field(default_factory=list)
    experience_years: float = Field(default=0.0, ge=0, le=80)
    education: list[Education] = Field(default_factory=list)

    @field_validator("skills", mode="before")
    @classmethod
    def _normalize_skills(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            v = [s for s in (part.strip() for part in v.split(",")) if s]
        # de-dupe case-insensitively while preserving order & original casing
        seen: set[str] = set()
        out: list[str] = []
        for s in v:
            s = str(s).strip()
            key = s.lower()
            if s and key not in seen:
                seen.add(key)
                out.append(s)
        return out


# ---------------------------------------------------------------------------
# API response schemas
# ---------------------------------------------------------------------------
class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: list[str]
    experience_years: float
    education: list[Education]
    status: str = "new"
    created_at: datetime


class CandidateStatusUpdate(BaseModel):
    status: CandidateStatus


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    similarity_score: float
    llm_score: float
    llm_reasoning: Optional[str] = None
    final_score: float


class RankedCandidate(BaseModel):
    """A candidate joined with its score, for the ranked shortlist endpoint."""

    candidate: CandidateOut
    score: ScoreOut


# ---------------------------------------------------------------------------
# Skill-gap analysis: how each candidate covers the job's required skills.
# ---------------------------------------------------------------------------
class CandidateSkillGap(BaseModel):
    candidate_id: uuid.UUID
    full_name: str
    matched: list[str]
    missing: list[str]
    coverage: float  # 0..1 = matched / required


class SkillGapReport(BaseModel):
    """Required skills parsed from the job, plus per-candidate coverage."""

    required_skills: list[str]
    candidates: list[CandidateSkillGap]


# ---------------------------------------------------------------------------
# Talent pool: every candidate across all of the user's jobs, searchable.
# ---------------------------------------------------------------------------
class ResumeDocumentOut(BaseModel):
    """The raw resume artifact stored in MongoDB for a candidate."""

    candidate_id: str
    job_id: str
    filename: str
    raw_text: str
    profile: dict
    created_at: datetime


class PooledCandidate(BaseModel):
    candidate_id: uuid.UUID
    full_name: str
    email: Optional[str] = None
    experience_years: float
    skills: list[str]
    job_id: uuid.UUID
    job_title: str
    status: str = "new"
    final_score: float
    coverage: Optional[float] = None  # matched / required for that candidate's job
