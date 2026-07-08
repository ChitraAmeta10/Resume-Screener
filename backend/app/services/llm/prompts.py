"""Prompt templates.

The delimiters (e.g. ``<<<RESUME_TEXT ... RESUME_TEXT>>>``) are good prompt
hygiene for real models *and* serve as a stable parsing seam for the offline
mock provider.
"""
from __future__ import annotations

import json

# The word "parser" / "scoring engine" in the system prompts also acts as a
# task hint the mock provider keys off of.
EXTRACTION_SYSTEM = (
    "You are a meticulous resume parser. Extract structured candidate data from "
    "the resume text. Respond with ONLY a single JSON object and nothing else - "
    "no markdown, no code fences, no commentary."
)

SCORING_SYSTEM = (
    "You are a hiring scoring engine. Given a job description and a candidate "
    "profile, judge how well the candidate fits the role. Respond with ONLY a "
    "single JSON object and nothing else."
)

JOB_SKILLS_SYSTEM = (
    "You are a job-description analyst. Extract the list of required/desired "
    "skills from the job description. Respond with ONLY a single JSON object."
)

_SCHEMA_HINT = {
    "full_name": "string",
    "email": "string or null",
    "phone": "string or null",
    "skills": ["string", "..."],
    "experience_years": "number",
    "education": [{"degree": "string", "institution": "string", "year": "number or null"}],
}


def build_extraction_prompt(resume_text: str, error_feedback: str | None = None) -> str:
    parts = [
        "Extract the candidate profile as JSON matching EXACTLY this shape:",
        json.dumps(_SCHEMA_HINT, indent=2),
        "",
        "Rules:",
        "- Output valid JSON only (parseable by json.loads).",
        "- Use null for unknown scalar fields; use [] for unknown lists.",
        "- skills: a flat list of individual skill strings.",
        "- experience_years: total years of professional experience as a number.",
        "",
        "<<<RESUME_TEXT",
        resume_text.strip(),
        "RESUME_TEXT>>>",
    ]
    if error_feedback:
        parts += [
            "",
            "Your previous response failed schema validation with this error:",
            f"<<<VALIDATION_ERROR\n{error_feedback}\nVALIDATION_ERROR>>>",
            "Fix the issues and return corrected JSON only.",
        ]
    return "\n".join(parts)


def build_scoring_prompt(job_title: str, job_description: str, skills: list[str]) -> str:
    return "\n".join(
        [
            "Score the candidate's fit for the job from 0 to 100 and give a one to "
            "two sentence justification.",
            'Return JSON exactly like: {"score": <0-100 number>, "reasoning": "<text>"}',
            "",
            f"Job title: {job_title}",
            "<<<JOB_DESCRIPTION",
            job_description.strip(),
            "JOB_DESCRIPTION>>>",
            "<<<CANDIDATE_SKILLS",
            ", ".join(skills),
            "CANDIDATE_SKILLS>>>",
        ]
    )


def build_job_skills_prompt(job_description: str) -> str:
    return "\n".join(
        [
            'Return JSON exactly like: {"required_skills": ["skill", "..."]}',
            "Extract concrete, individual skills (languages, frameworks, tools, ",
            "methodologies). Keep them short.",
            "",
            "<<<JOB_DESCRIPTION",
            job_description.strip(),
            "JOB_DESCRIPTION>>>",
        ]
    )
