"""Tests for the MongoDB resume-document store (via mongomock)."""
import io

JD = "Python engineer: FastAPI, PostgreSQL, Docker, AWS."
RESUME = (
    b"Jane Doe\njane@example.com\n7 years experience.\n"
    b"Skills: Python, FastAPI, Docker, AWS\n"
    b"B.S. Computer Science, Stanford University 2016\n"
)


def _job(client, headers) -> str:
    return client.post(
        "/v1/jobs", json={"title": "Backend", "description": JD}, headers=headers
    ).json()["id"]


def _upload(client, headers, job_id) -> str:
    files = [("files", ("jane.txt", io.BytesIO(RESUME), "text/plain"))]
    r = client.post(f"/v1/jobs/{job_id}/resumes/upload", files=files, headers=headers)
    return r.json()["created"][0]["id"]


def test_upload_stores_resume_document(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)

    r = client.get(f"/v1/candidates/{cid}/document", headers=recruiter_headers)
    assert r.status_code == 200
    doc = r.json()
    assert doc["candidate_id"] == cid
    assert doc["job_id"] == job_id
    assert "Jane Doe" in doc["raw_text"]
    # the full extraction artifact is stored as a nested document
    assert doc["profile"]["full_name"] == "Jane Doe"
    assert "Python" in doc["profile"]["skills"]


def test_document_is_owner_scoped(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)

    client.post(
        "/v1/auth/register", json={"email": "other@example.com", "password": "password1"}
    )
    token = client.post(
        "/v1/auth/login", data={"username": "other@example.com", "password": "password1"}
    ).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}

    assert client.get(f"/v1/candidates/{cid}/document", headers=other).status_code == 403


def test_deleting_candidate_removes_document(client, admin_headers):
    job_id = _job(client, admin_headers)
    cid = _upload(client, admin_headers, job_id)
    assert client.get(f"/v1/candidates/{cid}/document", headers=admin_headers).status_code == 200

    assert client.delete(f"/v1/candidates/{cid}", headers=admin_headers).status_code == 204
    # candidate gone from SQL → 404 (candidate not found), document gone from Mongo too
    assert client.get(f"/v1/candidates/{cid}/document", headers=admin_headers).status_code == 404


def test_deleting_job_removes_documents(client, recruiter_headers):
    job_id = _job(client, recruiter_headers)
    cid = _upload(client, recruiter_headers, job_id)
    client.delete(f"/v1/jobs/{job_id}", headers=recruiter_headers)
    # job (and its candidate) gone; document endpoint 404s on the missing candidate
    assert client.get(f"/v1/candidates/{cid}/document", headers=recruiter_headers).status_code == 404
