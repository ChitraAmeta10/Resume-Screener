"""Candidate listing, ranked shortlist, detail, and deletion."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.score import Score
from app.models.user import User
from app.schemas.candidate import (
    CandidateOut,
    CandidateSkillGap,
    CandidateStatusUpdate,
    PooledCandidate,
    RankedCandidate,
    ResumeDocumentOut,
    ScoreOut,
    SkillGapReport,
)
from app.services.cache import get_cache
from app.services.documents import get_document_store
from app.services.scorer import score_candidate

router = APIRouter(tags=["candidates"])


def _get_owned_job(db: Session, job_id: uuid.UUID, user: User) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized for this job")
    return job


def _coverage(required: list, skills: list) -> Optional[float]:
    if not required:
        return None
    have = {str(s).lower() for s in (skills or [])}
    matched = sum(1 for r in required if str(r).lower() in have)
    return round(matched / len(required), 4)


@router.get("/candidates", response_model=list[PooledCandidate])
def list_all_candidates(
    search: Optional[str] = Query(
        None, description="Filter by name, email, or skill (case-insensitive)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PooledCandidate]:
    """Every candidate across all of the current user's jobs, newest-scored first."""
    jobs = list(
        db.scalars(select(Job).where(Job.owner_id == current_user.id)).all()
    )
    job_by_id = {j.id: j for j in jobs}
    if not jobs:
        return []

    job_ids = list(job_by_id.keys())
    candidates = list(
        db.scalars(select(Candidate).where(Candidate.job_id.in_(job_ids))).all()
    )
    score_by_cand = {
        s.candidate_id: s
        for s in db.scalars(select(Score).where(Score.job_id.in_(job_ids))).all()
    }

    q = (search or "").strip().lower()

    def _matches(c: Candidate) -> bool:
        if not q:
            return True
        haystack = " ".join(
            [c.full_name or "", c.email or "", " ".join(c.skills or [])]
        ).lower()
        return q in haystack

    rows: list[PooledCandidate] = []
    for c in candidates:
        if not _matches(c):
            continue
        job = job_by_id.get(c.job_id)
        score = score_by_cand.get(c.id)
        rows.append(
            PooledCandidate(
                candidate_id=c.id,
                full_name=c.full_name,
                email=c.email,
                experience_years=c.experience_years or 0.0,
                skills=list(c.skills or []),
                job_id=c.job_id,
                job_title=job.title if job else "",
                status=c.status,
                final_score=round(float(score.final_score), 2) if score else 0.0,
                coverage=_coverage(
                    list(job.required_skills or []) if job else [],
                    list(c.skills or []),
                ),
            )
        )

    rows.sort(key=lambda r: r.final_score, reverse=True)
    return rows


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateOut])
def list_candidates(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Candidate]:
    _get_owned_job(db, job_id, current_user)
    stmt = (
        select(Candidate)
        .where(Candidate.job_id == job_id)
        .order_by(Candidate.created_at.desc())
    )
    return list(db.scalars(stmt).all())


@router.get("/jobs/{job_id}/ranked-candidates", response_model=list[RankedCandidate])
def ranked_candidates(
    job_id: uuid.UUID,
    rescore: bool = Query(False, description="Force recomputation of all scores"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RankedCandidate]:
    job = _get_owned_job(db, job_id, current_user)
    candidates = list(
        db.scalars(select(Candidate).where(Candidate.job_id == job_id)).all()
    )

    existing = {
        s.candidate_id: s
        for s in db.scalars(select(Score).where(Score.job_id == job_id)).all()
    }
    cache = get_cache()

    ranked: list[RankedCandidate] = []
    for cand in candidates:
        score_row = existing.get(cand.id)
        if score_row is None or rescore:
            if rescore:
                cache.delete(f"score:{job_id}:{cand.id}")
            result = score_candidate(
                job_id=str(job.id),
                job_title=job.title,
                job_description=job.description,
                candidate_id=str(cand.id),
                resume_text=cand.raw_resume_text or "",
                candidate_skills=list(cand.skills or []),
                use_cache=not rescore,
            )
            if score_row is None:
                score_row = Score(candidate_id=cand.id, job_id=job.id)
                db.add(score_row)
            score_row.similarity_score = result.similarity_score
            score_row.llm_score = result.llm_score
            score_row.llm_reasoning = result.llm_reasoning
            score_row.final_score = result.final_score

        ranked.append(
            RankedCandidate(
                candidate=CandidateOut.model_validate(cand),
                score=ScoreOut.model_validate(score_row),
            )
        )

    db.commit()
    ranked.sort(key=lambda rc: rc.score.final_score, reverse=True)
    return ranked


@router.get("/jobs/{job_id}/skill-gap", response_model=SkillGapReport)
def skill_gap_report(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SkillGapReport:
    """Report how each candidate covers the job's required skills.

    Reuses the ``required_skills`` already extracted for the job (and the
    candidate ``skills`` from resume extraction) rather than re-parsing text,
    so the breakdown stays consistent with the rest of the pipeline. Matching
    is case-insensitive.
    """
    job = _get_owned_job(db, job_id, current_user)
    required = list(job.required_skills or [])
    # lowercase -> canonical original, order-preserving and de-duplicated
    req_lookup: dict[str, str] = {}
    for skill in required:
        req_lookup.setdefault(str(skill).lower(), str(skill))

    candidates = list(
        db.scalars(select(Candidate).where(Candidate.job_id == job_id)).all()
    )
    rows: list[CandidateSkillGap] = []
    for cand in candidates:
        have = {str(s).lower() for s in (cand.skills or [])}
        matched = [orig for low, orig in req_lookup.items() if low in have]
        missing = [orig for low, orig in req_lookup.items() if low not in have]
        coverage = round(len(matched) / len(req_lookup), 4) if req_lookup else 0.0
        rows.append(
            CandidateSkillGap(
                candidate_id=cand.id,
                full_name=cand.full_name,
                matched=matched,
                missing=missing,
                coverage=coverage,
            )
        )
    return SkillGapReport(
        required_skills=list(req_lookup.values()), candidates=rows
    )


@router.get("/candidates/{candidate_id}", response_model=RankedCandidate)
def get_candidate(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RankedCandidate:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    _get_owned_job(db, candidate.job_id, current_user)

    score_row = db.scalar(
        select(Score).where(
            Score.candidate_id == candidate_id, Score.job_id == candidate.job_id
        )
    )
    score_out = (
        ScoreOut.model_validate(score_row)
        if score_row is not None
        else ScoreOut(similarity_score=0.0, llm_score=0.0, llm_reasoning=None, final_score=0.0)
    )
    return RankedCandidate(
        candidate=CandidateOut.model_validate(candidate), score=score_out
    )


@router.get("/candidates/{candidate_id}/document", response_model=ResumeDocumentOut)
def get_candidate_document(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return the raw resume document (text + extraction artifact) from MongoDB."""
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    _get_owned_job(db, candidate.job_id, current_user)  # authz: owner or admin

    doc = get_document_store().get(candidate_id)
    if doc is None:
        raise HTTPException(
            status_code=404,
            detail="No stored resume document (MongoDB store is not enabled).",
        )
    return doc


@router.patch("/candidates/{candidate_id}/status", response_model=CandidateOut)
def update_candidate_status(
    candidate_id: uuid.UUID,
    payload: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Candidate:
    """Move a candidate to a new hiring-pipeline stage (owner or admin only)."""
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    _get_owned_job(db, candidate.job_id, current_user)  # authz: owner or admin

    candidate.status = payload.status
    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete(
    "/candidates/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_candidate(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Response:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()
    get_document_store().delete([candidate_id])
    return Response(status_code=status.HTTP_204_NO_CONTENT)
