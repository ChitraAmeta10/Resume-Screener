"""Tests for the aggregated dashboard endpoint."""
import io

JD = (
    "Python engineer skilled in FastAPI, PostgreSQL, Docker, AWS, and Kubernetes. "
    "Machine Learning and NLP a plus."
)
RESUME = (
    b"Jane Doe\njane.doe@example.com\n5 years experience.\n"
    b"Skills: Python, FastAPI, Docker, AWS\n"
)


def _make_job(client, headers, title="Backend Engineer") -> str:
    return client.post(
        "/v1/jobs", json={"title": title, "description": JD}, headers=headers
    ).json()["id"]


def _upload(client, headers, job_id):
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    return client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=headers
    )


def test_dashboard_empty_for_new_user(client, recruiter_headers):
    r = client.get("/v1/dashboard", headers=recruiter_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["total_jobs"] == 0
    assert d["total_candidates"] == 0
    assert d["avg_fit_score"] == 0.0
    assert d["jobs"] == []
    assert d["top_candidates"] == []
    assert d["llm_provider"] == "mock"
    assert d["database"] == "sqlite"


def test_dashboard_aggregates_jobs_and_candidates(client, recruiter_headers):
    job_id = _make_job(client, recruiter_headers)
    _upload(client, recruiter_headers, job_id)
    # trigger scoring so fit metrics are populated
    client.get(f"/v1/jobs/{job_id}/ranked-candidates", headers=recruiter_headers)

    d = client.get("/v1/dashboard", headers=recruiter_headers).json()
    assert d["total_jobs"] == 1
    assert d["total_candidates"] == 1
    assert d["scored_candidates"] == 1

    fd = d["fit_distribution"]
    assert fd["strong"] + fd["moderate"] + fd["weak"] == 1

    assert len(d["jobs"]) == 1
    assert d["jobs"][0]["candidate_count"] == 1

    assert len(d["top_candidates"]) == 1
    top = d["top_candidates"][0]
    assert top["full_name"] == "Jane Doe"
    assert top["job_title"] == "Backend Engineer"
    assert 0.0 <= top["coverage"] <= 1.0

    # Jane's skills should show up in the talent-pool tally
    skills = {s["skill"]: s["count"] for s in d["top_skills"]}
    assert skills.get("Python", 0) >= 1


def test_dashboard_is_owner_scoped(client, recruiter_headers):
    _make_job(client, recruiter_headers)

    client.post(
        "/v1/auth/register", json={"email": "other@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "other@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    d = client.get("/v1/dashboard", headers=other).json()
    assert d["total_jobs"] == 0  # cannot see the recruiter's job
