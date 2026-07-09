"""Resume upload + structured extraction endpoint."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.candidates import _get_owned_job
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import CandidateOut
from app.services.documents import get_document_store
from app.services.extractor import ExtractionError, extract_profile
from app.services.parser import UnsupportedFileTypeError, extract_text

logger = logging.getLogger("resume_screener.resumes")
router = APIRouter(tags=["resumes"])


class UploadError(BaseModel):
    filename: str
    error: str


class UploadResponse(BaseModel):
    created: list[CandidateOut]
    errors: list[UploadError]


def _save_upload(job_id: uuid.UUID, file: UploadFile, content: bytes) -> Path:
    dest_dir = Path(settings.UPLOAD_DIR) / str(job_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "").suffix.lower()
    dest = dest_dir / f"{uuid.uuid4()}{suffix}"
    dest.write_bytes(content)
    return dest


@router.post("/jobs/{job_id}/resumes/upload", response_model=UploadResponse)
def upload_resumes(
    job_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="One or more PDF/DOCX/TXT resumes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    _get_owned_job(db, job_id, current_user)

    created: list[Candidate] = []
    errors: list[UploadError] = []
    # (candidate, raw_text, profile, filename) captured for the MongoDB doc store
    artifacts: list[tuple[Candidate, str, dict, str]] = []
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024

    for file in files:
        filename = file.filename or "unnamed"
        suffix = Path(filename).suffix.lower()
        try:
            if suffix not in settings.ALLOWED_EXTENSIONS:
                raise ValueError(f"Unsupported extension '{suffix}'")

            content = file.file.read()
            if len(content) > max_bytes:
                raise ValueError(f"File exceeds {settings.MAX_UPLOAD_MB} MB limit")
            if not content:
                raise ValueError("Empty file")

            saved_path = _save_upload(job_id, file, content)
            raw_text = extract_text(saved_path)
            if not raw_text.strip():
                raise ValueError("No extractable text found in file")

            profile = extract_profile(raw_text)
            candidate = Candidate(
                job_id=job_id,
                full_name=profile.full_name,
                email=profile.email,
                phone=profile.phone,
                skills=profile.skills,
                experience_years=profile.experience_years,
                education=[e.model_dump() for e in profile.education],
                raw_resume_text=raw_text,
                resume_file_path=str(saved_path),
            )
            db.add(candidate)
            created.append(candidate)
            artifacts.append((candidate, raw_text, profile.model_dump(), filename))
        except (ValueError, UnsupportedFileTypeError, ExtractionError) as exc:
            logger.warning("upload failed for %s: %s", filename, exc)
            errors.append(UploadError(filename=filename, error=str(exc)))
        finally:
            file.file.close()

    db.commit()
    for cand in created:
        db.refresh(cand)

    # Persist the raw resume text + extraction artifact to MongoDB (if enabled).
    store = get_document_store()
    for cand, raw_text, profile_doc, filename in artifacts:
        store.save(
            candidate_id=cand.id,
            job_id=cand.job_id,
            filename=filename,
            raw_text=raw_text,
            profile=profile_doc,
        )

    if not created and errors:
        # Nothing succeeded — surface a 422 with the per-file errors.
        raise HTTPException(
            status_code=422,
            detail={"created": [], "errors": [e.model_dump() for e in errors]},
        )

    return UploadResponse(
        created=[CandidateOut.model_validate(c) for c in created],
        errors=errors,
    )
