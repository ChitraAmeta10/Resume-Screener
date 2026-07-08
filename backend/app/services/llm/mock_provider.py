"""Deterministic, offline mock LLM provider.

Lets the entire pipeline run — and be tested — with **no API key and no network**.
It performs light heuristic parsing of the resume/JD text embedded in the prompt
so the produced structured data is actually meaningful for demos, not random.

It can also be configured to emit invalid JSON for the first ``fail_first_n``
extraction calls, which is used to exercise the extractor's validation-retry loop.
"""
from __future__ import annotations

import json
import re

from app.services.llm.base import LLMProvider

# A compact skills vocabulary for keyword scanning. Order defines output order.
SKILL_VOCAB = [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C++", "C#", "Ruby",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "FastAPI", "Flask", "Django", "React", "Vue", "Node.js", "Express",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD",
    "Machine Learning", "Deep Learning", "NLP", "Data Analysis", "Pandas",
    "TensorFlow", "PyTorch", "Scikit-learn", "Airflow", "Spark", "Kafka",
    "REST", "GraphQL", "Microservices", "Git", "Linux", "Pytest",
]

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"(\+?\d[\d\s().\-]{7,}\d)")
_YEARS_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_DEGREE_RE = re.compile(
    r"\b(Ph\.?D|Doctorate|M\.?B\.?A|M\.?S(?:c)?|Master(?:'s)?|B\.?S(?:c)?|"
    r"Bachelor(?:'s)?|B\.?Tech|M\.?Tech|B\.?E|B\.?A)\b",
    re.IGNORECASE,
)
_INSTITUTION_HINT = re.compile(r"(University|Institute|College|School)", re.IGNORECASE)
_NAME_LINE_RE = re.compile(r"^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$")


def _between(text: str, tag: str) -> str:
    m = re.search(rf"<<<{tag}\n(.*?)\n{tag}>>>", text, re.DOTALL)
    return m.group(1).strip() if m else ""


def _guess_name(resume_text: str) -> str:
    for line in resume_text.splitlines():
        line = line.strip()
        if not line:
            continue
        # explicit "Name: John Doe"
        m = re.match(r"(?:name)\s*[:\-]\s*(.+)", line, re.IGNORECASE)
        if m:
            return m.group(1).strip()[:255]
        if _NAME_LINE_RE.match(line) and "@" not in line:
            return line[:255]
    return "Unknown Candidate"


def _scan_skills(text: str) -> list[str]:
    lowered = text.lower()
    found = []
    for skill in SKILL_VOCAB:
        needle = skill.lower()
        pattern = r"(?<![a-z0-9])" + re.escape(needle) + r"(?![a-z0-9])"
        if re.search(pattern, lowered):
            found.append(skill)
    return found


def _guess_experience_years(text: str) -> float:
    matches = [float(m.group(1)) for m in _YEARS_RE.finditer(text)]
    return max(matches) if matches else 0.0


def _guess_education(text: str) -> list[dict]:
    education: list[dict] = []
    for line in text.splitlines():
        if _INSTITUTION_HINT.search(line) or _DEGREE_RE.search(line):
            degree_m = _DEGREE_RE.search(line)
            inst_m = _INSTITUTION_HINT.search(line)
            year_m = _YEAR_RE.search(line)
            if not (degree_m or inst_m):
                continue
            education.append(
                {
                    "degree": degree_m.group(0) if degree_m else None,
                    "institution": line.strip()[:255] if inst_m else None,
                    "year": int(year_m.group(0)) if year_m else None,
                }
            )
    # keep it tidy
    return education[:4]


class MockLLMProvider(LLMProvider):
    name = "mock"

    def __init__(self, fail_first_n: int = 0) -> None:
        self.fail_first_n = fail_first_n
        self._extract_calls = 0

    def complete(self, system: str, user: str, max_tokens: int = 1024) -> str:
        sys_l = system.lower()
        if "scoring engine" in sys_l:
            return self._score(user)
        if "job-description analyst" in sys_l:
            return self._job_skills(user)
        return self._extract(user)

    # -- tasks ---------------------------------------------------------------
    def _extract(self, user: str) -> str:
        self._extract_calls += 1
        if self._extract_calls <= self.fail_first_n:
            # Intentionally invalid: missing required ``full_name`` -> triggers retry.
            return json.dumps({"email": None, "skills": [], "experience_years": 0})

        resume = _between(user, "RESUME_TEXT") or user
        email_m = _EMAIL_RE.search(resume)
        phone_m = _PHONE_RE.search(resume)
        profile = {
            "full_name": _guess_name(resume),
            "email": email_m.group(0) if email_m else None,
            "phone": phone_m.group(1).strip() if phone_m else None,
            "skills": _scan_skills(resume),
            "experience_years": _guess_experience_years(resume),
            "education": _guess_education(resume),
        }
        return json.dumps(profile)

    def _score(self, user: str) -> str:
        jd = _between(user, "JOB_DESCRIPTION")
        skills_raw = _between(user, "CANDIDATE_SKILLS")
        candidate_skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        jd_skills = _scan_skills(jd)
        if jd_skills:
            overlap = [s for s in candidate_skills if s in jd_skills]
            ratio = len(overlap) / len(jd_skills)
            score = round(35 + 65 * ratio, 1)  # baseline 35, up to 100
            if overlap:
                reasoning = (
                    f"Matches {len(overlap)}/{len(jd_skills)} required skills "
                    f"({', '.join(overlap[:5])})."
                )
            else:
                reasoning = "No direct overlap with the required skills for this role."
        else:
            score = 50.0
            reasoning = "No explicit required skills detected; assigned a neutral score."
        return json.dumps({"score": score, "reasoning": reasoning})

    def _job_skills(self, user: str) -> str:
        jd = _between(user, "JOB_DESCRIPTION") or user
        return json.dumps({"required_skills": _scan_skills(jd)})
