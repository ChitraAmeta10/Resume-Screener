"""Aggregated overview across all of the current user's jobs."""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.score import Score
from app.models.user import User
from app.schemas.dashboard import (
    DashboardOut,
    FitDistribution,
    JobSummary,
    SkillCount,
    TopCandidate,
)

router = APIRouter(tags=["dashboard"])

# Fit bands, kept in sync with the frontend leaderboard thresholds.
STRONG, MODERATE = 65.0, 45.0


def _band(score: float) -> str:
    if score >= STRONG:
        return "strong"
    if score >= MODERATE:
        return "moderate"
    return "weak"


def _coverage(required: list[str], skills: list[str]) -> float | None:
    if not required:
        return None
    have = {str(s).lower() for s in (skills or [])}
    matched = sum(1 for r in required if str(r).lower() in have)
    return round(matched / len(required), 4)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOut:
    # Admins see the whole org (every recruiter's jobs); recruiters see only theirs.
    is_admin = current_user.role == "admin"
    job_stmt = select(Job).order_by(Job.created_at.desc())
    if not is_admin:
        job_stmt = job_stmt.where(Job.owner_id == current_user.id)
    jobs = list(db.scalars(job_stmt).all())
    job_ids = [j.id for j in jobs]

    scope = "team" if is_admin else "personal"
    recruiters = (
        len(db.scalars(select(User.id)).all()) if is_admin else 1
    )

    candidates: list[Candidate] = []
    scores: list[Score] = []
    if job_ids:
        candidates = list(
            db.scalars(select(Candidate).where(Candidate.job_id.in_(job_ids))).all()
        )
        scores = list(
            db.scalars(select(Score).where(Score.job_id.in_(job_ids))).all()
        )

    score_by_cand = {s.candidate_id: s for s in scores}
    job_by_id = {j.id: j for j in jobs}

    # ---- global fit metrics ----
    all_finals = [float(s.final_score) for s in scores]
    dist = Counter(_band(f) for f in all_finals)
    avg_fit = round(sum(all_finals) / len(all_finals), 2) if all_finals else 0.0

    # ---- per-job summaries ----
    cands_by_job: dict = {}
    for c in candidates:
        cands_by_job.setdefault(c.job_id, []).append(c)

    job_summaries: list[JobSummary] = []
    for j in jobs:
        j_cands = cands_by_job.get(j.id, [])
        j_finals = [
            float(score_by_cand[c.id].final_score)
            for c in j_cands
            if c.id in score_by_cand
        ]
        job_summaries.append(
            JobSummary(
                id=j.id,
                title=j.title,
                candidate_count=len(j_cands),
                scored_count=len(j_finals),
                avg_score=round(sum(j_finals) / len(j_finals), 2) if j_finals else 0.0,
                strong_count=sum(1 for f in j_finals if _band(f) == "strong"),
            )
        )

    # ---- top candidates across every job ----
    ranked = sorted(
        (c for c in candidates if c.id in score_by_cand),
        key=lambda c: float(score_by_cand[c.id].final_score),
        reverse=True,
    )
    top_candidates = [
        TopCandidate(
            candidate_id=c.id,
            full_name=c.full_name,
            job_id=c.job_id,
            job_title=job_by_id[c.job_id].title if c.job_id in job_by_id else "",
            final_score=round(float(score_by_cand[c.id].final_score), 2),
            coverage=_coverage(
                list(job_by_id[c.job_id].required_skills or [])
                if c.job_id in job_by_id
                else [],
                list(c.skills or []),
            ),
        )
        for c in ranked[:5]
    ]

    # ---- most common skills in the talent pool ----
    skill_counter: Counter = Counter()
    for c in candidates:
        for s in (c.skills or []):
            skill_counter[str(s)] += 1
    top_skills = [
        SkillCount(skill=skill, count=count)
        for skill, count in skill_counter.most_common(8)
    ]

    return DashboardOut(
        scope=scope,
        recruiters=recruiters,
        total_jobs=len(jobs),
        total_candidates=len(candidates),
        scored_candidates=len(scores),
        avg_fit_score=avg_fit,
        fit_distribution=FitDistribution(
            strong=dist.get("strong", 0),
            moderate=dist.get("moderate", 0),
            weak=dist.get("weak", 0),
        ),
        jobs=job_summaries,
        top_candidates=top_candidates,
        top_skills=top_skills,
        llm_provider=settings.LLM_PROVIDER,
        database="sqlite" if settings.is_sqlite else "postgres",
    )
