"""Structured extraction: turn messy resume text into a validated CandidateProfile.

The core pattern (and the main interview talking point):

    LLM call -> parse JSON -> validate against a strict Pydantic schema
             -> on validation failure, feed the error back into the prompt and
                retry (up to ``LLM_MAX_RETRIES`` times).

LLMs don't reliably emit schema-perfect JSON on the first try; this loop makes
the extraction robust instead of hoping the model behaves.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.candidate import CandidateProfile
from app.services.llm import LLMProvider, get_llm_provider
from app.services.llm.prompts import (
    EXTRACTION_SYSTEM,
    JOB_SKILLS_SYSTEM,
    build_extraction_prompt,
    build_job_skills_prompt,
)

logger = logging.getLogger("resume_screener.extractor")


class ExtractionError(RuntimeError):
    """Raised when structured extraction fails after all retries."""


def _extract_json_object(raw: str) -> dict:
    """Best-effort recovery of a JSON object from a raw model response.

    Handles code fences and surrounding prose by scanning for the first
    balanced ``{...}`` block.
    """
    text = raw.strip()
    if text.startswith("```"):
        # strip ```json ... ``` fences
        text = text.strip("`")
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    if start == -1:
        raise ValueError("no JSON object found in response")
    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(text[start : i + 1])
    raise ValueError("unbalanced JSON object in response")


def extract_profile(
    resume_text: str,
    provider: Optional[LLMProvider] = None,
    max_retries: Optional[int] = None,
) -> CandidateProfile:
    provider = provider or get_llm_provider()
    max_retries = settings.LLM_MAX_RETRIES if max_retries is None else max_retries

    error_feedback: Optional[str] = None
    last_error: Optional[Exception] = None

    for attempt in range(max_retries + 1):
        raw = provider.complete(
            system=EXTRACTION_SYSTEM,
            user=build_extraction_prompt(resume_text, error_feedback),
            max_tokens=1200,
        )
        try:
            data = _extract_json_object(raw)
            return CandidateProfile.model_validate(data)
        except (ValidationError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            error_feedback = str(exc)
            logger.warning(
                "extraction attempt %d/%d failed: %s",
                attempt + 1,
                max_retries + 1,
                error_feedback.splitlines()[0] if error_feedback else exc,
            )

    raise ExtractionError(
        f"Failed to extract a valid profile after {max_retries + 1} attempts: {last_error}"
    )


def extract_job_skills(
    description: str,
    provider: Optional[LLMProvider] = None,
) -> list[str]:
    """Extract a list of required skills from a job description (best-effort)."""
    provider = provider or get_llm_provider()
    try:
        raw = provider.complete(
            system=JOB_SKILLS_SYSTEM,
            user=build_job_skills_prompt(description),
            max_tokens=400,
        )
        data = _extract_json_object(raw)
        skills = data.get("required_skills", [])
        return [str(s).strip() for s in skills if str(s).strip()]
    except Exception as exc:  # non-critical: jobs can exist without extracted skills
        logger.warning("job-skill extraction failed: %s", exc)
        return []
