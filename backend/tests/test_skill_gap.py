"""Tests for the per-candidate skill-gap report."""
import io

JD = (
    "Looking for a Python engineer skilled in FastAPI, PostgreSQL, Docker, "
    "AWS, and Kubernetes. Machine Learning and NLP are a plus."
)

# Covers some required skills (Python/FastAPI/Docker) but misses others.
RESUME = (
    b"Jane Doe\n"
    b"jane.doe@example.com\n"
    b"5 years of professional experience.\n"
    b"Skills: Python, FastAPI, Docker, React\n"
)


def _make_job(client, headers) -> str:
    return client.post(
        "/v1/jobs", json={"title": "Backend Engineer", "description": JD}, headers=headers
    ).json()["id"]


def _upload(client, headers, job_id):
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    return client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=headers
    )


def test_skill_gap_reports_matched_and_missing(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    _upload(client, recruiter_headers, job_id)

    r = client.get(f"/v1/jobs/{job_id}/skill-gap", headers=recruiter_headers)
    assert r.status_code == 200
    body = r.json()

    required = set(body["required_skills"])
    assert {"Python", "FastAPI", "Docker", "Kubernetes"} <= required

    assert len(body["candidates"]) == 1
    cand = body["candidates"][0]
    assert cand["full_name"] == "Jane Doe"

    # Matched + missing partition the required set exactly, no overlap.
    assert set(cand["matched"]) | set(cand["missing"]) == required
    assert set(cand["matched"]) & set(cand["missing"]) == set()

    # Known coverage: Jane has Python/FastAPI/Docker but not Kubernetes/AWS/…
    assert {"Python", "FastAPI", "Docker"} <= set(cand["matched"])
    assert "Kubernetes" in cand["missing"]
    assert 0.0 < cand["coverage"] < 1.0
    assert cand["coverage"] == round(len(cand["matched"]) / len(required), 4)


def test_skill_gap_empty_when_no_candidates(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    r = client.get(f"/v1/jobs/{job_id}/skill-gap", headers=recruiter_headers)
    assert r.status_code == 200
    assert r.json()["candidates"] == []


def test_skill_gap_respects_ownership(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)

    client.post(
        "/v1/auth/register", json={"email": "intruder@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "intruder@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    assert client.get(f"/v1/jobs/{job_id}/skill-gap", headers=other).status_code == 403
