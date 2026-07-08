"""Tests for candidate hiring-pipeline status."""
import io

JD = "Python engineer: FastAPI, PostgreSQL, Docker."
RESUME = b"Jane Doe\njane@example.com\n5 years.\nSkills: Python, FastAPI, Docker\n"


def _job(client, headers) -> str:
    return client.post(
        "/v1/jobs", json={"title": "Backend", "description": JD}, headers=headers
    ).json()["id"]


def _upload(client, headers, job_id) -> str:
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    r = client.post(f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=headers)
    return r.json()["created"][0]["id"]


def test_new_candidate_defaults_to_new(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)
    cands = client.get(f"/v1/jobs/{job_id}/candidates", headers=recruiter_headers).json()
    assert cands[0]["status"] == "new"


def test_update_status_moves_stage(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)

    r = client.patch(
        f"/v1/candidates/{cid}/status",
        json={"status": "interview"},
        headers=recruiter_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "interview"

    # persisted + surfaced in the pool endpoint
    pool = client.get("/v1/candidates", headers=recruiter_headers).json()
    assert pool[0]["status"] == "interview"


def test_invalid_status_rejected(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)
    r = client.patch(
        f"/v1/candidates/{cid}/status", json={"status": "hired"}, headers=recruiter_headers
    )
    assert r.status_code == 422


def test_status_update_is_owner_scoped(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)

    client.post(
        "/v1/auth/register", json={"email": "other@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "other@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    r = client.patch(
        f"/v1/candidates/{cid}/status", json={"status": "offer"}, headers=other
    )
    assert r.status_code == 403
