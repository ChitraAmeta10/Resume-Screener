"""Tests for job deletion (cascades to candidates)."""
import io

JD = "Python engineer: FastAPI, Docker."
RESUME = b"Jane Doe\njane@example.com\nSkills: Python, FastAPI\n"


def _job(client, headers) -> str:
    return client.post(
        "/v1/jobs", json={"title": "Temp", "description": JD}, headers=headers
    ).json()["id"]


def test_delete_job_removes_it(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    r = client.delete(f"/v1/jobs/{job_id}", headers=recruiter_headers)
    assert r.status_code == 204
    assert r.content == b""  # 204 must have no body
    assert client.get(f"/v1/jobs/{job_id}", headers=recruiter_headers).status_code == 404


def test_delete_job_cascades_candidates(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    client.post(f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=recruiter_headers)
    assert len(client.get("/v1/candidates", headers=recruiter_headers).json()) == 1

    client.delete(f"/v1/jobs/{job_id}", headers=recruiter_headers)
    # candidate is gone from the pool too
    assert client.get("/v1/candidates", headers=recruiter_headers).json() == []


def test_delete_job_is_owner_scoped(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)

    client.post(
        "/v1/auth/register", json={"email": "other@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "other@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    assert client.delete(f"/v1/jobs/{job_id}", headers=other).status_code == 403
    # still there for the owner
    assert client.get(f"/v1/jobs/{job_id}", headers=recruiter_headers).status_code == 200
