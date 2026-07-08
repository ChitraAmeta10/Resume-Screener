"""Lightweight, dependency-free text embeddings.

Uses the hashing trick (signed, L2-normalized bag-of-words) so semantic-ish
similarity works offline and *deterministically* with no model download or API
call. It's intentionally simple; swapping in a real embedding model
(text-embedding-3, Voyage, pgvector, ...) is a drop-in change behind
``embed()`` / ``cosine_similarity()``.
"""
from __future__ import annotations

import hashlib
import math
import re

from app.core.config import settings

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _bucket(token: str, dim: int) -> tuple[int, float]:
    digest = hashlib.md5(token.encode("utf-8")).digest()
    index = int.from_bytes(digest[:4], "big") % dim
    sign = 1.0 if digest[4] & 1 else -1.0
    return index, sign


def embed(text: str, dim: int | None = None) -> list[float]:
    dim = dim or settings.EMBEDDING_DIM
    vec = [0.0] * dim
    for tok in _tokens(text):
        idx, sign = _bucket(tok, dim)
        vec[idx] += sign
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0.0:
        return vec
    return [v / norm for v in vec]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity of two (already L2-normalized) vectors, clamped to [0, 1]."""
    dot = sum(x * y for x, y in zip(a, b))
    return max(0.0, min(1.0, dot))


def text_similarity(a: str, b: str) -> float:
    return cosine_similarity(embed(a), embed(b))
