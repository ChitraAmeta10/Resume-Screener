"""Generate sample resumes (PDF, DOCX, TXT) and a job description.

Run:  python scripts/generate_sample_data.py
Output goes to the ``sample_data/`` directory.
"""
from __future__ import annotations

from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_data"

JOB_DESCRIPTION = """\
Senior Backend Engineer (AI Platform)

We're hiring a backend engineer to build AI-powered document-processing services.

Requirements:
- Strong Python and experience building REST APIs with FastAPI (or Flask/Django)
- Solid PostgreSQL and SQL data modeling
- Containerization with Docker and orchestration with Kubernetes
- Cloud deployment experience on AWS
- Comfort integrating LLMs and working with NLP / Machine Learning workflows
- CI/CD, Git, and automated testing (Pytest)

Nice to have: Redis, embeddings / semantic search, Terraform.
"""

RESUME_JANE = """\
Jane Doe
Senior Backend Engineer
jane.doe@example.com | +1 (415) 555-0100 | San Francisco, CA

Summary
Backend engineer with 8 years of experience building scalable Python services
and AI-powered data pipelines.

Skills
Python, FastAPI, PostgreSQL, Docker, Kubernetes, AWS, Redis, NLP,
Machine Learning, Pytest, Git, CI/CD, REST

Experience
Staff Engineer, DataCorp (2020-Present)
- Built FastAPI microservices processing millions of documents with LLM extraction.
- Designed PostgreSQL schemas and Redis caching for low-latency scoring.

Backend Engineer, CloudStart (2016-2020)
- Containerized services with Docker and deployed on AWS EKS (Kubernetes).

Education
B.S. in Computer Science, Stanford University, 2016
"""

RESUME_ARJUN = """\
Arjun Mehta
Software Engineer
arjun.mehta@example.com | +91 98765 43210 | Bangalore, IN

Summary
Full-stack engineer with 4 years of experience, primarily in Python web backends.

Skills
Python, Django, PostgreSQL, Docker, AWS, Git, REST, Pandas

Experience
Software Engineer, FinPay (2021-Present)
- Built Django REST APIs backed by PostgreSQL; deployed with Docker on AWS.

Education
B.Tech in Information Technology, IIT Delhi, 2021
"""

RESUME_MARIA = """\
Maria Santos
Frontend Developer
maria.santos@example.com | +351 912 345 678 | Lisbon, PT

Summary
Frontend developer with 3 years of experience building web interfaces.

Skills
JavaScript, TypeScript, React, Vue, Node.js, MySQL, Git

Experience
Frontend Developer, WebStudio (2022-Present)
- Built React and Vue single-page applications; some Node.js/Express backends.

Education
Bachelor of Design, University of Lisbon, 2022
"""


def _write_txt(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def _write_pdf(path: Path, text: str) -> None:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(str(path), pagesize=letter)
    width, height = letter
    y = height - 72
    for line in text.splitlines():
        c.drawString(72, y, line[:110])
        y -= 15
        if y < 72:
            c.showPage()
            y = height - 72
    c.save()


def _write_docx(path: Path, text: str) -> None:
    import docx

    document = docx.Document()
    for line in text.splitlines():
        document.add_paragraph(line)
    document.save(str(path))


def main() -> None:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    _write_txt(SAMPLE_DIR / "job_description.txt", JOB_DESCRIPTION)
    _write_pdf(SAMPLE_DIR / "resume_jane.pdf", RESUME_JANE)
    _write_docx(SAMPLE_DIR / "resume_arjun.docx", RESUME_ARJUN)
    _write_txt(SAMPLE_DIR / "resume_maria.txt", RESUME_MARIA)

    print(f"Sample data written to: {SAMPLE_DIR}")
    for p in sorted(SAMPLE_DIR.iterdir()):
        print(f"  - {p.name}")


if __name__ == "__main__":
    main()
