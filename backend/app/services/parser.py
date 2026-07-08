"""Extract raw text from uploaded resume files (PDF / DOCX / TXT).

Heavy parsing libraries are imported lazily so the module (and the test suite)
loads even if a given parser isn't installed until it's actually needed.
"""
from __future__ import annotations

from pathlib import Path


class UnsupportedFileTypeError(ValueError):
    pass


def extract_text(file_path: str | Path) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = _extract_pdf(path)
    elif suffix == ".docx":
        text = _extract_docx(path)
    elif suffix in (".txt", ".md"):
        text = path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise UnsupportedFileTypeError(f"Unsupported file type: {suffix or '(none)'}")
    return _normalize(text)


def _extract_pdf(path: Path) -> str:
    import pdfplumber  # lazy

    parts: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
    return "\n".join(parts)


def _extract_docx(path: Path) -> str:
    import docx  # python-docx, lazy

    document = docx.Document(str(path))
    parts = [p.text for p in document.paragraphs]
    # include table cell text too (resumes often use tables for layout)
    for table in document.tables:
        for row in table.rows:
            parts.extend(cell.text for cell in row.cells)
    return "\n".join(parts)


def _normalize(text: str) -> str:
    lines = [ln.rstrip() for ln in text.replace("\r\n", "\n").split("\n")]
    # collapse runs of blank lines
    out: list[str] = []
    blank = False
    for ln in lines:
        if ln.strip():
            out.append(ln)
            blank = False
        elif not blank:
            out.append("")
            blank = True
    return "\n".join(out).strip()
