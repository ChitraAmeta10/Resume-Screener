def test_health(client):
    assert client.get("/v1/health").json() == {"status": "ok"}


def test_register_login_me(client):
    r = client.post(
        "/v1/auth/register",
        json={"email": "a@example.com", "password": "password1"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "a@example.com"
    assert r.json()["role"] == "recruiter"

    r = client.post("/v1/auth/login", data={"username": "a@example.com", "password": "password1"})
    assert r.status_code == 200
    token = r.json()["access_token"]

    me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "a@example.com"


def test_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "password": "password1"}
    assert client.post("/v1/auth/register", json=payload).status_code == 201
    assert client.post("/v1/auth/register", json=payload).status_code == 400


def test_wrong_password_rejected(client):
    client.post("/v1/auth/register", json={"email": "b@example.com", "password": "password1"})
    r = client.post("/v1/auth/login", data={"username": "b@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_requires_token(client):
    assert client.get("/v1/jobs").status_code == 401
    assert client.get("/v1/jobs", headers={"Authorization": "Bearer garbage"}).status_code == 401
