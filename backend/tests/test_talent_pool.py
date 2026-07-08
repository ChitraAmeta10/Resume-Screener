"""Tests for the cross-job talent-pool endpoint (GET /v1/candidates)."""
import io

JD = "Python engineer: FastAPI, PostgreSQL, Docker, AWS, Kubernetes, NLP."
JANE = (
    b"Jane Doe\njane.doe@example.com\n8 years experience.\n"
    b"Skills: Python, FastAPI, Docker, Kubernetes, AWS\n"
)
BOB = (
    b"Bob Stone\nbob@example.com\n3 years experience.\n"
    b"Skills: JavaScript, React\n"
)


def _make_job(client, headers, title="Backend Engineer") -> str:
    return client.post(
        "/v1/jobs", json={"title": title, "description": JD}, headers=headers
    ).json()["id"]


def _upload(client, headers, job_id, name, blob):
    files = [("files", (name, io.BytesIO(blob), "text/plain"))]
    return client.post(
        f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=headers
    )


def test_pool_lists_candidates_across_jobs(client, recruiter_headers):
    j1 = _make_job(client, recruiter_headers, "Job One")
    j2 = _make_job(client, recruiter_headers, "Job Two")
    _upload(client, recruiter_headers, j1, "jane.txt", JANE)
    _upload(client, recruiter_headers, j2, "bob.txt", BOB)

    rows = client.get("/v1/candidates", headers=recruiter_headers).json()
    names = {r["full_name"] for r in rows}
    assert {"Jane Doe", "Bob Stone"} <= names
    # each row carries its job context
    jane = next(r for r in rows if r["full_name"] == "Jane Doe")
    assert jane["job_title"] == "Job One"
    assert "Kubernetes" in jane["skills"]


def test_pool_search_by_skill(client, recruiter_headers):
    j1 = _make_job(client, recruiter_headers)
    _upload(client, recruiter_headers, j1, "jane.txt", JANE)
    _upload(client, recruiter_headers, j1, "bob.txt", BOB)

    rows = client.get("/v1/candidates?search=kubernetes", headers=recruiter_headers).json()
    assert [r["full_name"] for r in rows] == ["Jane Doe"]


def test_pool_search_by_name(client, recruiter_headers):
    j1 = _make_job(client, recruiter_headers)
    _upload(client, recruiter_headers, j1, "jane.txt", JANE)
    _upload(client, recruiter_headers, j1, "bob.txt", BOB)

    rows = client.get("/v1/candidates?search=bob", headers=recruiter_headers).json()
    assert [r["full_name"] for r in rows] == ["Bob Stone"]


def test_pool_is_owner_scoped(client, recruiter_headers):
    j1 = _make_job(client, recruiter_headers)
    _upload(client, recruiter_headers, j1, "jane.txt", JANE)

    client.post(
        "/v1/auth/register", json={"email": "other@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "other@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    assert client.get("/v1/candidates", headers=other).json() == []
