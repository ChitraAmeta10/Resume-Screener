"""End-to-end demo of the Resume Screener.

By default this runs **fully in-process** with the offline mock LLM and a
temporary SQLite DB - no server, no Docker, no API key required:

    python scripts/demo.py

To run against a live server instead (e.g. `docker compose up`):

    python scripts/demo.py --base-url http://localhost:8000

It registers a recruiter, creates a job from the sample job description, uploads
the sample resumes, and prints the ranked shortlist.
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path

# Make the repo root importable when run as `python scripts/demo.py`.
_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

SAMPLE_DIR = _REPO_ROOT / "sample_data"
RESUMES = ["resume_jane.pdf", "resume_arjun.docx", "resume_maria.txt"]

EMAIL = "demo.recruiter@example.com"
PASSWORD = "password1"


def _ensure_samples() -> None:
    if not (SAMPLE_DIR / "job_description.txt").exists():
        print("Sample data missing - generating it first...")
        from scripts import generate_sample_data

        generate_sample_data.main()


def _content_type(name: str) -> str:
    if name.endswith(".pdf"):
        return "application/pdf"
    if name.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "text/plain"


def run(session, base: str) -> int:
    def url(path: str) -> str:
        return base + path

    # 1) auth
    session.post(url("/v1/auth/register"), json={"email": EMAIL, "password": PASSWORD})
    login = session.post(
        url("/v1/auth/login"), data={"username": EMAIL, "password": PASSWORD}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[1/4] Authenticated as {EMAIL}")

    # 2) create job
    jd = (SAMPLE_DIR / "job_description.txt").read_text(encoding="utf-8")
    job = session.post(
        url("/v1/jobs"),
        json={"title": "Senior Backend Engineer (AI Platform)", "description": jd},
        headers=headers,
    ).json()
    job_id = job["id"]
    print(f"[2/4] Created job {job_id}")
    print(f"      Extracted required skills: {', '.join(job['required_skills'])}")

    # 3) upload resumes
    files = []
    for name in RESUMES:
        data = (SAMPLE_DIR / name).read_bytes()
        files.append(("files", (name, data, _content_type(name))))
    up = session.post(
        url(f"/v1/jobs/{job_id}/resumes/upload"), files=files, headers=headers
    ).json()
    print(f"[3/4] Uploaded {len(RESUMES)} resumes -> extracted {len(up['created'])} profiles")
    for cand in up["created"]:
        print(
            f"      - {cand['full_name']:<14} {cand['experience_years']:>4} yrs  "
            f"skills: {', '.join(cand['skills'][:6])}"
        )
    if up.get("errors"):
        print(f"      errors: {up['errors']}")

    # 4) ranked shortlist
    ranked = session.get(
        url(f"/v1/jobs/{job_id}/ranked-candidates"), headers=headers
    ).json()
    print("[4/4] Ranked shortlist:")
    print("      " + "-" * 78)
    print(f"      {'#':<3}{'Name':<16}{'Final':>7}{'Sim':>7}{'LLM':>7}  Reasoning")
    print("      " + "-" * 78)
    for i, rc in enumerate(ranked, 1):
        s = rc["score"]
        print(
            f"      {i:<3}{rc['candidate']['full_name']:<16}"
            f"{s['final_score']:>7.1f}{s['similarity_score'] * 100:>7.1f}{s['llm_score']:>7.1f}  "
            f"{(s['llm_reasoning'] or '')[:44]}"
        )
    print("      " + "-" * 78)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default=None,
        help="Run against a live server (e.g. http://localhost:8000). "
        "Omit to run fully in-process with the mock LLM.",
    )
    args = parser.parse_args()

    _ensure_samples()

    if args.base_url:
        import requests  # only needed for HTTP mode

        print(f"Running demo against live server: {args.base_url}\n")
        with requests.Session() as session:
            return run(session, args.base_url.rstrip("/"))

    # In-process mode: configure an offline environment BEFORE importing the app.
    tmp_db = Path(tempfile.gettempdir()) / "resume_screener_demo.db"
    tmp_db.unlink(missing_ok=True)
    os.environ.setdefault("LLM_PROVIDER", "mock")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"
    os.environ["AUTO_CREATE_TABLES"] = "true"
    os.environ.setdefault("UPLOAD_DIR", str(Path(tempfile.gettempdir()) / "rs_demo_uploads"))

    from fastapi.testclient import TestClient

    import app.models  # noqa: F401
    from app.main import app

    print("Running demo in-process (offline mock LLM, temporary SQLite DB)\n")
    with TestClient(app) as session:
        code = run(session, "")
    tmp_db.unlink(missing_ok=True)
    return code


if __name__ == "__main__":
    sys.exit(main())
