JD = (
    "Looking for a Python engineer skilled in FastAPI, PostgreSQL, Docker, and AWS. "
    "Experience with Machine Learning and NLP is a plus."
)


def test_create_job_extracts_skills(client, recruiter_headers):
    r = client.post(
        "/v1/jobs",
        json={"title": "Backend Engineer", "description": JD},
        headers=recruiter_headers,
    )
    assert r.status_code == 201
    body = r.json()
    skills = set(body["required_skills"])
    # mock extractor scans a known vocab; these should all be detected
    assert {"Python", "FastAPI", "PostgreSQL", "Docker", "AWS"} <= skills


def test_create_job_with_explicit_skills(client, recruiter_headers):
    r = client.post(
        "/v1/jobs",
        json={"title": "Role", "description": JD, "required_skills": ["X", "Y"]},
        headers=recruiter_headers,
    )
    assert r.json()["required_skills"] == ["X", "Y"]


def test_list_jobs_is_owner_scoped(client):
    # two separate recruiters
    def token(email):
        client.post("/v1/auth/register", json={"email": email, "password": "password1"})
        return client.post(
            "/v1/auth/login", data={"username": email, "password": "password1"}
        ).json()["access_token"]

    h1 = {"Authorization": f"Bearer {token('one@example.com')}"}
    h2 = {"Authorization": f"Bearer {token('two@example.com')}"}

    client.post("/v1/jobs", json={"title": "J1", "description": JD}, headers=h1)

    assert len(client.get("/v1/jobs", headers=h1).json()) == 1
    assert len(client.get("/v1/jobs", headers=h2).json()) == 0


def test_cannot_access_others_job(client):
    def token(email):
        client.post("/v1/auth/register", json={"email": email, "password": "password1"})
        return client.post(
            "/v1/auth/login", data={"username": email, "password": "password1"}
        ).json()["access_token"]

    h1 = {"Authorization": f"Bearer {token('owner@example.com')}"}
    h2 = {"Authorization": f"Bearer {token('intruder@example.com')}"}

    job_id = client.post(
        "/v1/jobs", json={"title": "Secret", "description": JD}, headers=h1
    ).json()["id"]

    assert client.get(f"/v1/jobs/{job_id}/candidates", headers=h2).status_code == 403
