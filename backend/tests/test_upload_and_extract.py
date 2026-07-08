import io

import pytest

from app.schemas.candidate import CandidateProfile
from app.services.extractor import (
    ExtractionError,
    _extract_json_object,
    extract_profile,
)
from app.services.llm.mock_provider import MockLLMProvider

JD = "Python engineer: FastAPI, PostgreSQL, Docker, AWS, NLP."
RESUME = (
    b"Jane Doe\n"
    b"jane.doe@example.com\n"
    b"+1 415 555 0100\n"
    b"7 years of professional experience.\n"
    b"Skills: Python, FastAPI, PostgreSQL, Docker, AWS, NLP\n"
    b"B.S. Computer Science, Stanford University 2016\n"
)


def _make_job(client, headers) -> str:
    return client.post(
        "/v1/jobs", json={"title": "Backend", "description": JD}, headers=headers
    ).json()["id"]


def test_upload_txt_resume_extracts_structured_fields(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    r = client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=recruiter_headers
    )
    assert r.status_code == 200
    data = r.json()
    assert data["errors"] == []
    assert len(data["created"]) == 1

    cand = data["created"][0]
    assert cand["full_name"] == "Jane Doe"
    assert cand["email"] == "jane.doe@example.com"
    assert cand["experience_years"] == 7.0
    assert {"Python", "FastAPI", "AWS"} <= set(cand["skills"])
    assert cand["education"]  # at least one entry parsed


def test_upload_rejects_unsupported_extension(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    files = [("files", ("resume.exe", io.BytesIO(b"nope"), "application/octet-stream"))]
    r = client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=recruiter_headers
    )
    # nothing succeeded -> 422 with per-file errors
    assert r.status_code == 422


def test_multi_upload_partial_success(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    files = [
        ("files", ("ok.txt", io.BytesIO(RESUME), "text/plain")),
        ("files", ("bad.exe", io.BytesIO(b"x"), "application/octet-stream")),
    ]
    r = client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=recruiter_headers
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["created"]) == 1
    assert len(data["errors"]) == 1
    assert data["errors"][0]["filename"] == "bad.exe"


# ---- extractor unit tests -------------------------------------------------

def test_extract_profile_happy_path():
    profile = extract_profile(RESUME.decode(), provider=MockLLMProvider())
    assert isinstance(profile, CandidateProfile)
    assert profile.full_name == "Jane Doe"
    assert profile.experience_years == 7.0


def test_extract_profile_retries_on_validation_failure():
    # Mock returns invalid JSON on the first call, valid on the retry.
    provider = MockLLMProvider(fail_first_n=1)
    profile = extract_profile(RESUME.decode(), provider=provider, max_retries=2)
    assert profile.full_name == "Jane Doe"
    assert provider._extract_calls == 2  # failed once, succeeded on retry


def test_extract_profile_raises_after_exhausting_retries():
    provider = MockLLMProvider(fail_first_n=5)
    with pytest.raises(ExtractionError):
        extract_profile(RESUME.decode(), provider=provider, max_retries=2)


# ---- JSON recovery helper -------------------------------------------------

def test_json_recovery_from_code_fence():
    raw = '```json\n{"a": 1, "b": [2,3]}\n```'
    assert _extract_json_object(raw) == {"a": 1, "b": [2, 3]}


def test_json_recovery_from_surrounding_prose():
    raw = 'Sure! Here is the data: {"full_name": "X", "skills": ["Python"]} Hope that helps.'
    assert _extract_json_object(raw)["full_name"] == "X"


def test_json_recovery_handles_nested_braces():
    raw = 'noise {"a": {"b": {"c": 1}}, "d": "}"} trailing'
    assert _extract_json_object(raw) == {"a": {"b": {"c": 1}}, "d": "}"}
