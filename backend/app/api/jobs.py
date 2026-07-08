"""Job posting endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobOut
from app.services.extractor import extract_job_skills

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    skills = payload.required_skills
    if skills is None:
        # Extract required skills from the description via the LLM.
        skills = extract_job_skills(payload.description)

    job = Job(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        required_skills=skills,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Job]:
    stmt = select(Job).where(Job.owner_id == current_user.id).order_by(Job.created_at.desc())
    return list(db.scalars(stmt).all())


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    from app.api.candidates import _get_owned_job  # local import to avoid cycle

    return _get_owned_job(db, job_id, current_user)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Delete a job (owner or admin). Its candidates and scores cascade away."""
    from app.api.candidates import _get_owned_job  # local import to avoid cycle

    job = _get_owned_job(db, job_id, current_user)
    db.delete(job)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
