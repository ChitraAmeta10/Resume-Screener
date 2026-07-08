"""Aggregated overview data for the dashboard."""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel


class FitDistribution(BaseModel):
    strong: int
    moderate: int
    weak: int


class JobSummary(BaseModel):
    id: uuid.UUID
    title: str
    candidate_count: int
    scored_count: int
    avg_score: float
    strong_count: int


class TopCandidate(BaseModel):
    candidate_id: uuid.UUID
    full_name: str
    job_id: uuid.UUID
    job_title: str
    final_score: float
    coverage: Optional[float] = None  # matched / required, if the job has skills


class SkillCount(BaseModel):
    skill: str
    count: int


class DashboardOut(BaseModel):
    # "team" for admins (org-wide across every recruiter) or "personal" for recruiters.
    scope: str
    recruiters: int  # number of accounts on the team (only meaningful for admins)
    total_jobs: int
    total_candidates: int
    scored_candidates: int
    avg_fit_score: float
    fit_distribution: FitDistribution
    jobs: list[JobSummary]
    top_candidates: list[TopCandidate]
    top_skills: list[SkillCount]
    llm_provider: str
    database: str
